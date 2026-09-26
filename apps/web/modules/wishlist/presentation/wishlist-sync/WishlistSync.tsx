'use client'

import { useEffect, useRef } from 'react'

import { useIsAuthenticated } from '@/modules/auth/core/facade'

import { clearWishlist, loadAccountWishlist, mergeGuestWishlist } from '../../core/actions/accountSync'

// Renders nothing. Watches the sign-in state and keeps the local wishlist in
// step with the account:
// - already signed in when the page loads: load the account's list
// - signs in: merge the guest list into the account
// - signs out: clear the local list, so the next person on this browser
//   does not see it
export const WishlistSync = () => {
  const isAuthenticated = useIsAuthenticated()
  const previous = useRef<boolean | null>(null)

  useEffect(() => {
    const wasAuthenticated = previous.current
    previous.current = isAuthenticated

    if (isAuthenticated && wasAuthenticated === null) {
      loadAccountWishlist().catch(() => {})
    } else if (isAuthenticated && wasAuthenticated === false) {
      mergeGuestWishlist().catch(() => {})
    } else if (!isAuthenticated && wasAuthenticated) {
      clearWishlist()
    }
  }, [isAuthenticated])

  return null
}
