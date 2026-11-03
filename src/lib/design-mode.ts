// Localhost-only, development-only access to UI for design work.
// No Firebase token or server-side permissions are granted.
export function getLocalDesignRole(pathname: string): 'admin' | 'user' | null {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return null;
  if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) return null;
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;
  if (pathname === '/design/user') return 'user';
  if (pathname === '/design/admin') return 'admin';
  return null;
}
