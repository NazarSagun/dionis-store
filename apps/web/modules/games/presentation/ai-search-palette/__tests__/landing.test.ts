import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { landFilters } from '../landing'

const reducedMotion = (matches: boolean) =>
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches } as MediaQueryList)

describe('landFilters', () => {
  const startViewTransition = vi.fn((update: () => Promise<void>) => ({ ready: Promise.resolve(), finished: update() }))
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

  it('lands the folded menus on the Filters button below sm, then scrolls to the games', async () => {
    reducedMotion(true)
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    document.body.innerHTML = `
      <button data-ai-target="filters">Filters</button>
      <button data-ai-target="platform" hidden>Platform</button>
      <div data-testid="game-library"></div>`
    const filters = document.querySelector<HTMLElement>("[data-ai-target='filters']")!
    vi.spyOn(filters, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)
    const library = document.querySelector<HTMLElement>("[data-testid='game-library']")!
    const scrollIntoView = vi.fn()
    library.scrollIntoView = scrollIntoView

    await landFilters({ url: '/?platform=PC', keys: ['search', 'platform'], navigate })

    expect(document.documentElement.getAttribute('data-ai-glow')).toBe('search platform filters')
    expect(filters.style.viewTransitionName).toBe('')
    expect(scrollIntoView).not.toHaveBeenCalled()
    vi.advanceTimersByTime(600)
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
    document.body.innerHTML = ''
  })
})
