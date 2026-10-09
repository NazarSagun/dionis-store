// Placeholder origin to resolve a path against. A path that resolves to any
// other origin, such as "//host", "/\host" or "/\t/host", points off the site.
const SAME_SITE = 'http://same-site.invalid'

// Where login sends the user after it succeeds. Only a path on this site is
// allowed: anything else falls back to the home page, so a crafted login link
// cannot send the user to another site.
export const safeNextPath = (raw: string | null | undefined): string => {
  if (!raw?.startsWith('/')) return '/'
  const url = new URL(raw, SAME_SITE)
  if (url.origin !== SAME_SITE) return '/'
  return `${url.pathname}${url.search}${url.hash}`
}

// The login page link that returns the user to `path` once they are signed in.
export const loginHref = (path: string | null | undefined): string => {
  const next = safeNextPath(path)
  return next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`
}
