export type NullableNumberInput = string | number | null;
export type NullableTextInput = string | null;

export interface Profile {
  id: string;
  name: string;
  color?: NullableTextInput;
  is_disabled?: boolean;
}

export interface ExerciseEntry {
  name: string;
  weight?: NullableNumberInput;
  unit?: NullableTextInput;
  sets?: NullableNumberInput;
  reps?: NullableTextInput;
  notes?: NullableTextInput;
}

export interface GymSession {
  id: string;
  user_id: string;
  date: string;
  exercises?: ExerciseEntry[] | null;
}

export interface HiitSession {
  id: string;
  user_id: string;
  date: string;
  name?: NullableTextInput;
  rounds?: NullableNumberInput;
  duration?: NullableNumberInput;
  rpe?: NullableNumberInput;
}

export type DashboardSession = GymSession | HiitSession;

export interface BodyMetric {
  id: string;
  user_id: string;
  date: string;
  weight?: NullableNumberInput;
  weight_unit?: string | null;
  fat_pct?: NullableNumberInput;
  muscle_pct?: NullableNumberInput;
}

export interface AdminRecord {
  user_id: string;
  added_by?: NullableTextInput;
}

export interface AuthUser {
  id: string;
  email?: NullableTextInput;
}

export interface MemberBestPR {
  name: string;
  w: number;
  unit: string;
}

export interface MemberData extends Profile {
  lastDate: string;
  sesMonth: number;
  heatmap: number[];
  bestPR: MemberBestPR | null;
  userSessions: DashboardSession[];
  gymUser: GymSession[];
}

export interface AdminUserRow extends Profile {
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  isDisabled?: boolean;
}

export interface ChartLike {
  destroy(): void;
  update(): void;
  options: Record<string, unknown>;
  data?: {
    datasets?: Array<Record<string, unknown>>;
  };
}

export type ChartCtor = new (target: Element | null, config: unknown) => ChartLike;

export interface ExerciseCatalogEntry {
  id: string;
  slug: string;
  canonical_name: string;
  muscle_group: string;
  is_active: boolean;
  rec_count: number;
}

export interface ExerciseRecommendation {
  id: number;
  exercise_id: string;
  section: 'step' | 'error' | 'tip' | 'link';
  order_index: number;
  content: string;
}
