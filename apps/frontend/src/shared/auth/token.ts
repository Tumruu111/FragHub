import { TOKEN_KEY } from '../../config';

export const setToken = (token: string) =>
  localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

interface Session {
  id: string;
  role: 'Admin' | 'User';
  exp?: number;
}

// Reads the JWT's payload. This is only for the UI (what to show, where to
// send people); the API checks the signature and role on every request.
const decode = (token: string): Session | null => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

// The logged-in session, or null. An expired or unreadable token is dropped,
// so the header stops saying "Logout" once the 7-day login runs out.
export const getSession = (): Session | null => {
  const token = getToken();
  if (!token) return null;
  const session = decode(token);
  if (!session || (session.exp && session.exp * 1000 <= Date.now())) {
    clearToken();
    return null;
  }
  return session;
};

export const isAuthenticated = () => getSession() !== null;
export const isAdmin = () => getSession()?.role === 'Admin';

// The API rejected our token (expired, or logged out elsewhere): drop it and
// send the user to the matching login page. Anonymous requests that need a
// login are left alone — there's no session to end.
export const endExpiredSession = () => {
  if (!getToken()) return;
  clearToken();
  const admin = window.location.pathname.startsWith('/admin');
  window.location.assign(admin ? '/admin/login' : '/login');
};
