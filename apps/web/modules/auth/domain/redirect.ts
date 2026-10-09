// Where login sends the user after it succeeds. Only a path on this site is
// allowed: a full URL, "//host" and a backslash all fall back to the home page,
// so a crafted login link cannot send the user to another site.
export const safeNextPath = (raw: string | null | undefined): string => {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return '/'
  return raw
}

// The login page link that returns the user to `path` once they are signed in.
export const loginHref = (path: string | null | undefined): string => {
  const next = safeNextPath(path)
  return next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`
}
