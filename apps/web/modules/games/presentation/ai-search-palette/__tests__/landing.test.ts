import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { landFilters } from '../landing'

const reducedMotion = (matches: boolean) =>
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches } as MediaQueryList)

describe('landFilters', () => {
  const startViewTransition = vi.fn((update: () => Promise<void>) => ({ finished: update() }))
  const navigate = () => window.history.pushState({}, '', '/?platform=PC')

  beforeEach(() => {
    window.history.replaceState({}, '', '/')
    window.matchMedia ??= (() => ({ matches: false })) as unknown as typeof window.matchMedia
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    Object.assign(document, { startViewTransition })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    startViewTransition.mockClear()
    Reflect.deleteProperty(document, 'startViewTransition')
  })

  it('runs the navigation inside a view transition, then glows the changed menus for 2.4 seconds', async () => {
    reducedMotion(false)
    await landFilters({ url: '/?platform=PC', keys: ['platform'], navigate })

    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(window.location.search).toBe('?platform=PC')
    expect(document.documentElement.getAttribute('data-ai-glow')).toBe('platform')
    expect(document.documentElement.hasAttribute('data-ai-landing')).toBe(false)

    vi.useFakeTimers()
    await landFilters({ url: '/?platform=PC', keys: ['platform'], navigate })
    vi.advanceTimersByTime(2400)
    expect(document.documentElement.hasAttribute('data-ai-glow')).toBe(false)
  })

  it('skips the flight for a user who prefers reduced motion', async () => {
    reducedMotion(true)
    await landFilters({ url: '/?platform=PC', keys: ['platform'], navigate })

    expect(startViewTransition).not.toHaveBeenCalled()
    expect(window.location.search).toBe('?platform=PC')
    expect(document.documentElement.getAttribute('data-ai-glow')).toBe('platform')
  })
})
