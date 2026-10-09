import { describe, expect, it } from 'vitest'

import { loginHref, safeNextPath } from '../domain/redirect'

describe('safeNextPath', () => {
  it.each(['/game/3', '/account?tab=wishlist', '/'])('keeps the site path %s', (path) => {
    expect(safeNextPath(path)).toBe(path)
  })

  it.each([
    null,
    undefined,
    '',
    'game/3',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/\t/evil.example',
    '/\n/evil.example',
    'data:text/html,x',
  ])('falls back to the home page for %p', (value) => {
    expect(safeNextPath(value)).toBe('/')
  })
})

describe('loginHref', () => {
  it('adds the encoded return path', () => {
    expect(loginHref('/game/3')).toBe('/login?next=%2Fgame%2F3')
  })

  it('links to the plain login page when there is nowhere to return to', () => {
    expect(loginHref(null)).toBe('/login')
    expect(loginHref('//evil.example')).toBe('/login')
  })
})
