import { AiFilterKey } from '../../domain/ai-search'

// The flying transition of the AI search spec (Feature 3). Two attributes on
// <html> drive the CSS in app/globals.css, so the toolbar needs no code for it:
// - data-ai-landing gives each toolbar control the view-transition-name of the
//   chip that lands on it. It is set only after the browser took the "old"
//   picture, because one name must not appear twice in a picture.
// - data-ai-glow lists the controls the result changed, for the glow.

const GLOW_MS = 2400
// The browser aborts a view transition whose update takes 4 seconds.
const WAIT_FOR_URL_MS = 2500
const POLL_MS = 16

// Polls with setTimeout: the browser runs no animation frames while a view
// transition waits for its update, so requestAnimationFrame would stall.
const waitForUrl = (url: string) =>
  new Promise<void>((resolve) => {
    const started = performance.now()
    const check = () => {
      const landed = window.location.pathname + window.location.search === url
      if (landed || performance.now() - started > WAIT_FOR_URL_MS) resolve()
      else setTimeout(check, POLL_MS)
    }
    check()
  })

interface LandOptions {
  url: string
  keys: AiFilterKey[]
  // Removes the palette and starts the navigation. Runs inside the transition.
  navigate: () => void
}

export async function landFilters({ url, keys, navigate }: LandOptions) {
  const root = document.documentElement
  // The router commits the new page before it updates the address, so a
  // matching address means the home page shows the new filters.
  const update = async () => {
    root.setAttribute('data-ai-landing', '')
    navigate()
    await waitForUrl(url)
    window.scrollTo({ top: 0 })
  }

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reducedMotion) {
    await update()
  } else {
    // A transition that the browser skips still runs `update`.
    await document.startViewTransition(update).finished.catch(() => undefined)
  }

  root.removeAttribute('data-ai-landing')
  root.setAttribute('data-ai-glow', keys.join(' '))
  window.setTimeout(() => root.removeAttribute('data-ai-glow'), GLOW_MS)
}
