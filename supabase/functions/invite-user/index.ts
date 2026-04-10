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

type InvitePayload = {
  email?: string;
  grant_dashboard_access?: boolean;
};

type PermissionCheckResult = {
  canInvite: boolean;
  isSuperAdmin: boolean;
};

type EnvConfig = {
  supabaseUrl: string;
  serviceRoleKey: string;
  demoDefaultPassword: string;
};

function maskSecret(secret: string): string {
  if (secret.length <= 4) return '*'.repeat(secret.length);
  return `${secret.slice(0, 3)}${'*'.repeat(Math.max(4, secret.length - 5))}${secret.slice(-2)}`;
}

function jsonResponse(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}

function readEnvConfig(): EnvConfig | null {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const demoDefaultPassword = Deno.env.get('DEMO_DEFAULT_PASSWORD') || '';
  if (!supabaseUrl || !serviceRoleKey || !demoDefaultPassword) return null;
  return { supabaseUrl, serviceRoleKey, demoDefaultPassword };
}

function getBearerToken(req: Request): string {
  const authHeader = req.headers.get('Authorization') || '';
  return authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
}

async function parsePayload(req: Request): Promise<InvitePayload | null> {
  try {
    return (await req.json()) as InvitePayload;
  } catch {
    return null;
  }
}

function normalizeInviteRequest(body: InvitePayload): { email: string; grantDashboardAccess: boolean } | null {
  const email = (body.email || '').trim().toLowerCase();
  const grantDashboardAccess = Boolean(body.grant_dashboard_access);
  if (!email.includes('@')) return null;
  return { email, grantDashboardAccess };
}

async function checkPermissions(admin: ReturnType<typeof createClient>, actorId: string): Promise<PermissionCheckResult | null> {
  const [canInviteRes, isSuperAdminRes] = await Promise.all([
    admin.rpc('can_invite', { uid: actorId }),
    admin.rpc('is_super_admin', { uid: actorId }),
  ]);

  if (canInviteRes.error || isSuperAdminRes.error) return null;
  return {
    canInvite: canInviteRes.data === true,
    isSuperAdmin: isSuperAdminRes.data === true,
  };
}

async function maybeGrantDashboardRole(
  admin: ReturnType<typeof createClient>,
  invitedUserId: string | null,
  actorId: string,
  grantDashboardAccess: boolean,
): Promise<'ok' | 'grant_failed' | 'skipped'> {
  if (!grantDashboardAccess || !invitedUserId) return 'skipped';

  const upsertRes = await admin
    .from('gym_admins')
    .upsert({ user_id: invitedUserId, added_by: actorId }, { onConflict: 'user_id' });

  return upsertRes.error ? 'grant_failed' : 'ok';
}

async function handleInvite(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  const config = readEnvConfig();
  if (!config) {
    return jsonResponse(500, { error: 'missing_supabase_env' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return jsonResponse(401, { error: 'missing_bearer_token' });
  }

  const admin = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) {
    return jsonResponse(401, { error: 'invalid_token' });
  }

  const body = await parsePayload(req);
  if (!body) {
    return jsonResponse(400, { error: 'invalid_json' });
  }

  const normalized = normalizeInviteRequest(body);
  if (!normalized) {
    return jsonResponse(400, { error: 'invalid_email' });
  }

  const actorId = authData.user.id;
  const permissions = await checkPermissions(admin, actorId);
  if (!permissions) {
    return jsonResponse(500, { error: 'permission_check_failed' });
  }
  if (!permissions.canInvite) {
    return jsonResponse(403, { error: 'forbidden' });
  }
  if (normalized.grantDashboardAccess && !permissions.isSuperAdmin) {
    return jsonResponse(403, { error: 'only_super_admin_can_grant_dashboard_access' });
  }

  const inviteRes = await admin.auth.admin.createUser({
    email: normalized.email,
    password: config.demoDefaultPassword,
    email_confirm: true,
    user_metadata: {
      invited_by: actorId,
      demo_default_password: true,
    },
  });

  if (inviteRes.error) {
    return jsonResponse(400, { error: 'invite_failed', detail: inviteRes.error.message });
  }

  const invitedUserId = inviteRes.data.user?.id || null;
  const grantResult = await maybeGrantDashboardRole(admin, invitedUserId, actorId, normalized.grantDashboardAccess);
  if (grantResult === 'grant_failed') {
    return jsonResponse(500, { error: 'invite_sent_but_role_grant_failed' });
  }

  return jsonResponse(200, {
    ok: true,
    invited_email: normalized.email,
    invited_user_id: invitedUserId,
    dashboard_access_granted: grantResult === 'ok',
    default_password_masked: maskSecret(config.demoDefaultPassword),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  return handleInvite(req);
});
