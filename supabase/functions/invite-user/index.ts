import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type InvitePayload = {
  email?: string;
  grant_dashboard_access?: boolean;
};

function jsonResponse(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: 'missing_supabase_env' });
  }

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return jsonResponse(401, { error: 'missing_bearer_token' });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) {
    return jsonResponse(401, { error: 'invalid_token' });
  }

  const actorId = authData.user.id;

  let body: InvitePayload;
  try {
    body = (await req.json()) as InvitePayload;
  } catch {
    return jsonResponse(400, { error: 'invalid_json' });
  }

  const email = (body.email || '').trim().toLowerCase();
  const grantDashboardAccess = Boolean(body.grant_dashboard_access);
  if (!email || !email.includes('@')) {
    return jsonResponse(400, { error: 'invalid_email' });
  }

  const [canInviteRes, isSuperAdminRes] = await Promise.all([
    admin.rpc('can_invite', { uid: actorId }),
    admin.rpc('is_super_admin', { uid: actorId }),
  ]);

  if (canInviteRes.error) {
    return jsonResponse(500, { error: 'permission_check_failed', detail: canInviteRes.error.message });
  }
  if (isSuperAdminRes.error) {
    return jsonResponse(500, { error: 'permission_check_failed', detail: isSuperAdminRes.error.message });
  }

  const canInvite = canInviteRes.data === true;
  const isSuperAdmin = isSuperAdminRes.data === true;
  if (!canInvite) {
    return jsonResponse(403, { error: 'forbidden' });
  }

  if (grantDashboardAccess && !isSuperAdmin) {
    return jsonResponse(403, { error: 'only_super_admin_can_grant_dashboard_access' });
  }

  const inviteRes = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      invited_by: actorId,
    },
  });

  if (inviteRes.error) {
    return jsonResponse(400, { error: 'invite_failed', detail: inviteRes.error.message });
  }

  let dashboardGranted = false;
  const invitedUserId = inviteRes.data.user?.id || null;

  if (grantDashboardAccess && invitedUserId) {
    const upsertRes = await admin
      .from('gym_admins')
      .upsert({ user_id: invitedUserId, added_by: actorId }, { onConflict: 'user_id' });

    if (upsertRes.error) {
      return jsonResponse(500, { error: 'invite_sent_but_role_grant_failed', detail: upsertRes.error.message });
    }

    dashboardGranted = true;
  }

  return jsonResponse(200, {
    ok: true,
    invited_email: email,
    invited_user_id: invitedUserId,
    dashboard_access_granted: dashboardGranted,
  });
});
