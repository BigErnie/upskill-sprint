import { getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};
const MAX_BODY_BYTES = 4 * 1024 * 1024;

function json(status, body) {
  return new Response(JSON.stringify(body), {status, headers: JSON_HEADERS});
}

function normalizeRole(role) {
  return String(role || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function roleList(user) {
  const direct = Array.isArray(user?.roles) ? user.roles : [];
  const metadata = user?.appMetadata || user?.app_metadata || {};
  const stored = Array.isArray(metadata.roles) ? metadata.roles : [];
  return Array.from(new Set(direct.concat(stored).map(normalizeRole)));
}

function organizationId(user) {
  const metadata = user?.appMetadata || user?.app_metadata || {};
  return metadata.organizationId || metadata.organization_id || null;
}

function requestOriginIsValid(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export default async function materialChecker(request) {
  const user = await getUser();
  if (!user) return json(401, {error: 'Authentication is required.'});

  const userId = user.id || user.sub;
  if (!userId) return json(401, {error: 'The authenticated user does not have a valid identifier.'});

  const roles = roleList(user);
  const orgId = organizationId(user);
  const namespace = orgId ? `organization-${orgId}` : `user-${userId}`;
  const key = `${namespace}/workspace.json`;
  const store = getStore('material-checker-workspaces');

  try {
    if (request.method === 'GET') {
      const record = await store.get(key, {type: 'json', consistency: 'strong'});
      return json(200, record || {workspace: null, updatedAt: null, scope: namespace});
    }

    if (request.method === 'PUT' || request.method === 'POST') {
      if (!requestOriginIsValid(request)) return json(403, {error: 'Request origin is not permitted.'});
      const raw = await request.text();
      if (!raw) return json(400, {error: 'A workspace payload is required.'});
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
        return json(413, {error: 'Workspace payload exceeds the 4 MB limit.'});
      }

      const payload = JSON.parse(raw);
      if (!payload?.workspace || typeof payload.workspace !== 'object') {
        return json(400, {error: 'Invalid workspace payload.'});
      }

      const updatedAt = new Date().toISOString();
      const record = {
        workspace: payload.workspace,
        updatedAt,
        updatedBy: user.email || userId,
        scope: namespace,
        schemaVersion: 4
      };

      await store.setJSON(key, record, {
        metadata: {updatedAt, updatedBy: user.email || userId, schemaVersion: 4}
      });
      return json(200, {ok: true, updatedAt, scope: namespace});
    }

    if (request.method === 'DELETE') {
      if (!requestOriginIsValid(request)) return json(403, {error: 'Request origin is not permitted.'});
      const allowed = roles.includes('system-administrator') || roles.includes('standards-administrator');
      if (!allowed) return json(403, {error: 'Administrator permission is required to delete an organization workspace.'});
      await store.delete(key);
      return json(200, {ok: true, deletedAt: new Date().toISOString(), scope: namespace});
    }

    return json(405, {error: 'Method not allowed.'});
  } catch (error) {
    console.error('material-checker function error', error);
    if (error instanceof SyntaxError) return json(400, {error: 'The workspace payload is not valid JSON.'});
    return json(500, {error: 'The organization workspace could not be processed.'});
  }
}
