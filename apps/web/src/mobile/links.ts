export const mobileScheme = 'com.agendaflex.ross';
export function mobileAuthTarget(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (
      url.protocol !== `${mobileScheme}:` ||
      url.username ||
      url.password ||
      url.port
    )
      return null;
    const path =
      url.hostname === 'auth' && url.pathname === '/callback'
        ? '/auth/callback'
        : url.hostname === 'redefinir-senha' && ['', '/'].includes(url.pathname)
          ? '/redefinir-senha'
          : null;
    if (!path) return null;
    const query = new URLSearchParams();
    for (const key of ['code', 'error']) {
      const value = url.searchParams.get(key);
      if (value) query.set(key, value);
    }
    return path + (query.size ? `?${query}` : '');
  } catch {
    return null;
  }
}
