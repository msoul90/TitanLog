BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.exercise_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  canonical_name text NOT NULL UNIQUE,
  muscle_group text NOT NULL,
  difficulty text NULL,
  equipment text[] NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exercise_aliases (
  id bigserial PRIMARY KEY,
  exercise_id uuid NOT NULL REFERENCES public.exercise_catalog(id) ON DELETE CASCADE,
  alias text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exercise_id, alias)
);

CREATE TABLE IF NOT EXISTS public.exercise_recommendations (
  id bigserial PRIMARY KEY,
  exercise_id uuid NOT NULL REFERENCES public.exercise_catalog(id) ON DELETE CASCADE,
  section text NOT NULL CHECK (section IN ('step', 'error', 'tip')),
  order_index int NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exercise_id, section, order_index)
);

CREATE INDEX IF NOT EXISTS idx_exercise_catalog_name_lower
  ON public.exercise_catalog ((lower(canonical_name)));

CREATE INDEX IF NOT EXISTS idx_exercise_catalog_name_trgm
  ON public.exercise_catalog USING gin (canonical_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_exercise_aliases_alias_trgm
  ON public.exercise_aliases USING gin (alias gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_exercise_aliases_exercise_id
  ON public.exercise_aliases (exercise_id);

CREATE INDEX IF NOT EXISTS idx_exercise_recommendations_exercise_section_order
  ON public.exercise_recommendations (exercise_id, section, order_index);

ALTER TABLE public.exercise_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exercise_catalog_read_all ON public.exercise_catalog;
DROP POLICY IF EXISTS exercise_aliases_read_all ON public.exercise_aliases;
DROP POLICY IF EXISTS exercise_recommendations_read_all ON public.exercise_recommendations;
DROP POLICY IF EXISTS exercise_catalog_no_direct_write ON public.exercise_catalog;
DROP POLICY IF EXISTS exercise_aliases_no_direct_write ON public.exercise_aliases;
DROP POLICY IF EXISTS exercise_recommendations_no_direct_write ON public.exercise_recommendations;

CREATE POLICY exercise_catalog_read_all
ON public.exercise_catalog
FOR SELECT
TO authenticated
USING (is_active = true OR public.is_gym_admin(auth.uid()));

CREATE POLICY exercise_aliases_read_all
ON public.exercise_aliases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exercise_catalog c
    WHERE c.id = exercise_aliases.exercise_id
      AND (c.is_active = true OR public.is_gym_admin(auth.uid()))
  )
);

CREATE POLICY exercise_recommendations_read_all
ON public.exercise_recommendations
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1
    FROM public.exercise_catalog c
    WHERE c.id = exercise_recommendations.exercise_id
      AND (c.is_active = true OR public.is_gym_admin(auth.uid()))
  )
);

CREATE POLICY exercise_catalog_no_direct_write
ON public.exercise_catalog
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY exercise_aliases_no_direct_write
ON public.exercise_aliases
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY exercise_recommendations_no_direct_write
ON public.exercise_recommendations
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.list_exercise_catalog_light()
RETURNS TABLE (
  id uuid,
  slug text,
  canonical_name text,
  muscle_group text,
  aliases text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT
    c.id,
    c.slug,
    c.canonical_name,
    c.muscle_group,
    COALESCE(array_agg(a.alias ORDER BY a.alias) FILTER (WHERE a.alias IS NOT NULL), '{}'::text[]) AS aliases
  FROM public.exercise_catalog c
  LEFT JOIN public.exercise_aliases a ON a.exercise_id = c.id
  WHERE c.is_active = true
  GROUP BY c.id, c.slug, c.canonical_name, c.muscle_group
  ORDER BY c.canonical_name;
$$;

CREATE OR REPLACE FUNCTION public.search_exercises(q text, p_limit int DEFAULT 12)
RETURNS TABLE (
  id uuid,
  slug text,
  canonical_name text,
  muscle_group text,
  score real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  WITH input AS (
    SELECT trim(coalesce(q, '')) AS term
  )
  SELECT
    c.id,
    c.slug,
    c.canonical_name,
    c.muscle_group,
    GREATEST(
      similarity(lower(c.canonical_name), lower(i.term)),
      COALESCE(ax.alias_score, 0)
    ) AS score
  FROM input i
  JOIN public.exercise_catalog c ON c.is_active = true
  LEFT JOIN LATERAL (
    SELECT MAX(similarity(lower(a.alias), lower(i.term))) AS alias_score
    FROM public.exercise_aliases a
    WHERE a.exercise_id = c.id
  ) ax ON true
  WHERE i.term <> ''
    AND (
      lower(c.canonical_name) LIKE lower(i.term) || '%'
      OR lower(c.canonical_name) LIKE '%' || lower(i.term) || '%'
      OR EXISTS (
        SELECT 1
        FROM public.exercise_aliases a2
        WHERE a2.exercise_id = c.id
          AND (
            lower(a2.alias) LIKE lower(i.term) || '%'
            OR lower(a2.alias) LIKE '%' || lower(i.term) || '%'
          )
      )
    )
  ORDER BY score DESC, c.canonical_name ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 12), 50));
$$;

CREATE OR REPLACE FUNCTION public.get_exercise_guide(p_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  WITH exercise AS (
    SELECT c.id, c.slug, c.canonical_name, c.muscle_group
    FROM public.exercise_catalog c
    WHERE c.slug = p_slug
      AND c.is_active = true
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'id', e.id,
    'slug', e.slug,
    'name', e.canonical_name,
    'muscle_group', e.muscle_group,
    'steps', COALESCE((
      SELECT jsonb_agg(r.content ORDER BY r.order_index)
      FROM public.exercise_recommendations r
      WHERE r.exercise_id = e.id AND r.section = 'step' AND r.is_active = true
    ), '[]'::jsonb),
    'errors', COALESCE((
      SELECT jsonb_agg(r.content ORDER BY r.order_index)
      FROM public.exercise_recommendations r
      WHERE r.exercise_id = e.id AND r.section = 'error' AND r.is_active = true
    ), '[]'::jsonb),
    'tips', COALESCE((
      SELECT jsonb_agg(r.content ORDER BY r.order_index)
      FROM public.exercise_recommendations r
      WHERE r.exercise_id = e.id AND r.section = 'tip' AND r.is_active = true
    ), '[]'::jsonb)
  )
  FROM exercise e;
$$;

REVOKE ALL ON FUNCTION public.list_exercise_catalog_light() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_exercises(text, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_exercise_guide(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.list_exercise_catalog_light() TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_exercises(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exercise_guide(text) TO authenticated;

COMMIT;
