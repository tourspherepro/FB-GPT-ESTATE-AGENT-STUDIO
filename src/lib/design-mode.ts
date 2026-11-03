// Local UI-design access only. It never grants a Firebase identity or server privileges.
export function getLocalDesignRole(pathname: string): 'admin' | 'user' | null {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return null;
  if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) return null;
  // Never bypass login when a real Firebase web app is configured.
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;
  const role = new URLSearchParams(window.location.search).get('design');
  if ((pathname === '/dashboard' && role === 'user') ||
      (pathname === '/admin' && role === 'admin')) {
    return role;
  }
  return null;
}
