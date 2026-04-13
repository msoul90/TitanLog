// @ts-expect-error Deno runtime resolves URL imports at execution time.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ManageAction = 'disable' | 'enable' | 'delete';

type ManagePayload = {
  target_user_id?: string;
  action?: ManageAction;
};

type ValidatedPayload = {
  targetId: string;
  action: ManageAction;
};

const UUID_V4ISH_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function getBearerToken(req: Request): string {
  const authHeader = req.headers.get('Authorization')?.trim() || '';
  if (!authHeader) return '';

  const [scheme, ...tokenParts] = authHeader.split(/\s+/);
  if (!scheme || !/^bearer$/i.test(scheme)) return '';

  const token = tokenParts.join(' ').trim();
  return token || '';
}

function isValidTargetUserId(value: string): boolean {
  return UUID_V4ISH_REGEX.test(value);
}

function actionFailedPayload(err: unknown): Record<string, unknown> {
  const payload: Record<string, unknown> = { error: 'action_failed' };
  if (Deno.env.get('EDGE_DEBUG') === 'true') {
    payload.detail = err instanceof Error ? err.message : 'Unknown error';
  }
  return payload;
}

function createAdminClient(): ReturnType<typeof createClient> | null {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function authenticateActor(
  req: Request,
): Promise<{ actorId: string } | { error: 'missing_bearer_token' | 'invalid_token' }> {
  const token = getBearerToken(req);
  if (!token) return { error: 'missing_bearer_token' };

  // Standard Supabase pattern: user-context client validates the JWT via /auth/v1/user
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return { error: 'invalid_token' };
  return { actorId: authData.user.id };
}

async function parseAndValidatePayload(req: Request): Promise<ValidatedPayload | 'invalid_json' | null> {
  let body: ManagePayload;
  try {
    body = (await req.json()) as ManagePayload;
  } catch {
    return 'invalid_json';
  }

  const { target_user_id: targetId, action } = body;
  const validActions: ManageAction[] = ['disable', 'enable', 'delete'];
  if (!targetId || !action || !validActions.includes(action)) return null;
  if (!isValidTargetUserId(targetId)) return null;

  return { targetId, action };
}

async function checkPermissions(
  admin: ReturnType<typeof createClient>,
  actorId: string,
  targetId: string,
): Promise<'ok' | 'permission_check_failed' | 'forbidden' | 'cannot_manage_super_admin'> {
  const [actorSuperRes, targetSuperRes] = await Promise.all([
    admin.rpc('is_super_admin', { uid: actorId }),
    admin.rpc('is_super_admin', { uid: targetId }),
  ]);

  if (actorSuperRes.error || targetSuperRes.error) return 'permission_check_failed';
  if (actorSuperRes.data !== true) return 'forbidden';
  if (targetSuperRes.data === true) return 'cannot_manage_super_admin';
  return 'ok';
}

async function executeManageAction(
  admin: ReturnType<typeof createClient>,
  action: ManageAction,
  targetId: string,
): Promise<void> {
  if (action === 'disable') {
    const { error } = await admin.auth.admin.updateUserById(targetId, {
      ban_duration: '87600h', // ~10 years = effectively permanent
    });
    if (error) throw error;
    const { error: profileUpdateError } = await admin
      .from('profiles')
      .update({ is_disabled: true })
      .eq('id', targetId);
    if (profileUpdateError) throw profileUpdateError;
    return;
  }

  if (action === 'enable') {
    const { error } = await admin.auth.admin.updateUserById(targetId, {
      ban_duration: 'none',
    });
    if (error) throw error;
    const { error: profileUpdateError } = await admin
      .from('profiles')
      .update({ is_disabled: false })
      .eq('id', targetId);
    if (profileUpdateError) throw profileUpdateError;
    return;
  }

  const { error } = await admin.auth.admin.deleteUser(targetId);
  if (error) throw error;
  // Profile deleted via CASCADE on auth.users FK
}

async function handleManage(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  const admin = createAdminClient();
  if (!admin) {
    return jsonResponse(500, { error: 'missing_supabase_env' });
  }

  const authResult = await authenticateActor(req);
  if ('error' in authResult) {
    return jsonResponse(401, { error: authResult.error });
  }
  const { actorId } = authResult;

  const payload = await parseAndValidatePayload(req);
  if (payload === 'invalid_json') {
    return jsonResponse(400, { error: 'invalid_json' });
  }
  if (!payload) {
    return jsonResponse(400, { error: 'invalid_payload' });
  }

  const { targetId, action } = payload;

  if (actorId === targetId) {
    return jsonResponse(403, { error: 'cannot_manage_self' });
  }

  const permissionResult = await checkPermissions(admin, actorId, targetId);
  if (permissionResult === 'permission_check_failed') {
    return jsonResponse(500, { error: 'permission_check_failed' });
  }
  if (permissionResult === 'forbidden') {
    return jsonResponse(403, { error: 'forbidden' });
  }
  if (permissionResult === 'cannot_manage_super_admin') {
    return jsonResponse(403, { error: 'cannot_manage_super_admin' });
  }

  try {
    await executeManageAction(admin, action, targetId);
    return jsonResponse(200, { ok: true, action, target_user_id: targetId });
  } catch (err: unknown) {
    return jsonResponse(500, actionFailedPayload(err));
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  return handleManage(req);
});
