// AaplaGaav Backend API Client
// Connects to existing Node.js + Express backend (default port 3000 or proxied via /api)

const API_BASE = import.meta.env.VITE_BACKEND_API_URL || '';

/**
 * Check backend service health status
 * GET /api/health
 */
export async function getBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message || 'Backend connection failed' };
  }
}

/**
 * Verify user's admin authorization using backend role middleware
 * GET /api/test-roles/admin-only
 * 
 * Enforces admin authorization from the backend authority.
 * Returns role and village_id if verified, or throws error if denied.
 */
export async function verifyBackendAdminRole(token) {
  if (!token) {
    throw new Error('No authorization token provided');
  }

  const res = await fetch(`${API_BASE}/api/test-roles/admin-only`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = body.error || (res.status === 403 
      ? 'Access denied: You do not have administrator permissions' 
      : 'Authentication failed');
    const error = new Error(errorMsg);
    error.status = res.status;
    throw error;
  }

  return body; // { message: 'Welcome Admin!', role: 'admin', village_id: '...' }
}

/**
 * Test user authentication token against backend
 * GET /api/test-auth
 */
export async function verifyBackendAuth(token) {
  if (!token) {
    throw new Error('No authorization token provided');
  }

  const res = await fetch(`${API_BASE}/api/test-auth`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Backend authentication check failed');
  }

  return await res.json();
}
