import { AiFilterKey, aiTransitionName } from '../../domain/ai-search'

// The flying transition of the AI search spec (Feature 3). Two attributes on
// <html> drive the CSS in app/globals.css, so the toolbar needs no code for it:
// - data-ai-landing gives each toolbar control the view-transition-name of the
//   chip that lands on it. It is set only after the browser took the "old"
//   picture, because one name must not appear twice in a picture.
// - data-ai-glow lists the controls the result changed, for the glow.
// Below sm the toolbar folds the menus into one Filters button. The chips for
// the folded menus fly into that button, and it glows in their place.

const GLOW_MS = 2400
// The browser aborts a view transition whose update takes 4 seconds.
const WAIT_FOR_URL_MS = 2500
const POLL_MS = 16
// Lets the glow show on the toolbar before the page moves to the games.
const SCROLL_TO_GAMES_DELAY_MS = 600
// Matches the chip flight in app/globals.css.
const FLIGHT_MS = 650
const FLIGHT_STAGGER_MS = 70
const FLIGHT_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

const FILTERS_MENU = "[data-ai-target='filters']"
const GAMES_LIST = "[data-testid='game-library']"

const isShown = (element: Element | null): element is HTMLElement =>
  element instanceof HTMLElement && element.getClientRects().length > 0

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

// One element can carry only one view-transition-name, so the first folded
// chip pairs with the Filters button and the rest fly to it from here.
const flyInto = (target: HTMLElement, keys: AiFilterKey[]) => {
  const root = document.documentElement
  const box = target.getBoundingClientRect()
  keys.forEach((key, index) => {
    const pseudoElement = `::view-transition-group(${aiTransitionName(key)})`
    const from = getComputedStyle(root, pseudoElement)
    root.animate(
      [
        { transform: from.transform, width: from.width, height: from.height, opacity: 1 },
        {
          transform: `translate(${box.left}px, ${box.top}px)`,
          width: `${box.width}px`,
          height: `${box.height}px`,
          opacity: 0,
        },
      ],
      {
        duration: FLIGHT_MS,
        delay: FLIGHT_STAGGER_MS * (index + 1),
        easing: FLIGHT_EASING,
        fill: 'both',
        pseudoElement,
      },
    )
  })
}

interface LandOptions {
  url: string
  keys: AiFilterKey[]
  // Removes the palette and starts the navigation. Runs inside the transition.
  navigate: () => void
}

export async function landFilters({ url, keys, navigate }: LandOptions) {
  const root = document.documentElement
  // Set inside `update`, once the home page shows the toolbar.
  const fold: { menu?: HTMLElement; keys: AiFilterKey[] } = { keys: [] }

  // The router commits the new page before it updates the address, so a
  // matching address means the home page shows the new filters.
  const update = async () => {
    root.setAttribute('data-ai-landing', '')
    navigate()
    await waitForUrl(url)
    window.scrollTo({ top: 0 })

    const menu = document.querySelector(FILTERS_MENU)
    fold.keys = keys.filter((key) => key !== 'search' && !isShown(document.querySelector(`[data-ai-target='${key}']`)))
    if (fold.keys.length > 0 && isShown(menu)) {
      fold.menu = menu
      menu.style.viewTransitionName = aiTransitionName(fold.keys[0])
    }
  }

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reducedMotion) {
    await update()
  } else {
    // A transition that the browser skips still runs `update`.
    const transition = document.startViewTransition(update)
    transition.ready.then(() => fold.menu && flyInto(fold.menu, fold.keys.slice(1))).catch(() => undefined)
    await transition.finished.catch(() => undefined)
  }

  root.removeAttribute('data-ai-landing')
  fold.menu?.style.removeProperty('view-transition-name')
  root.setAttribute('data-ai-glow', [...keys, ...(fold.menu ? ['filters'] : [])].join(' '))
  window.setTimeout(() => root.removeAttribute('data-ai-glow'), GLOW_MS)

  window.setTimeout(
    () =>
      document
        .querySelector(GAMES_LIST)
        ?.scrollIntoView?.({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }),
    SCROLL_TO_GAMES_DELAY_MS,
  )
}
