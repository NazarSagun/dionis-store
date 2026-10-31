import { useSyncExternalStore } from 'react'

// The Tailwind `lg` breakpoint. Grumli stands on a card from here up, and in the page flow below it.
const QUERY = '(min-width: 1024px)'

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia?.(QUERY)
  media?.addEventListener('change', onChange)
  return () => media?.removeEventListener('change', onChange)
}

export const useIsDesktop = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(QUERY).matches ?? false,
    () => false,
  )
