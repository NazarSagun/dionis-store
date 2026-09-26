import { WishlistItem } from '../../domain/models'
import { toWishlistItems } from '../../integration/mappers'
import {
  acknowledgeWishlistDiscount,
  addWishlistItem,
  getWishlist,
  mergeWishlist,
  removeWishlistItem,
} from '../../integration/repository'
import { useWishlistStore } from '../store'

// A signed-in player's wishlist lives on their account. The store stays the
// one thing the UI reads: every change applies to it at once, then the
// server's list replaces it. A guest's wishlist never leaves the store.

export async function toggleWishlistItem(item: Omit<WishlistItem, 'addedAt'>, isAuthenticated: boolean) {
  const store = useWishlistStore.getState()
  const wasInWishlist = store.isInWishlist(item.id)
  const previousItems = store.items
  store.toggleItem(item)

  if (!isAuthenticated) return

  try {
    const items = wasInWishlist ? await removeWishlistItem(item.id) : await addWishlistItem(item.id)
    useWishlistStore.getState().replaceItems(toWishlistItems(items))
  } catch (error) {
    useWishlistStore.getState().replaceItems(previousItems)
    throw error
  }
}

// A failed call only means the same badge may show once more on the next
// visit, so the local change stays and the error is not surfaced.
export async function acknowledgeDiscount(id: number, discount: number, isAuthenticated: boolean) {
  useWishlistStore.getState().updateDiscountSnapshot(id, discount)
  if (!isAuthenticated) return

  try {
    await acknowledgeWishlistDiscount(id)
  } catch {
    // See above.
  }
}

// On login: the guest's local items join the account, then the account's
// list replaces the local one.
export async function mergeGuestWishlist() {
  const guestItems = useWishlistStore.getState().items
  const items = guestItems.length
    ? await mergeWishlist({
        items: guestItems.map((item) => ({ gameId: item.id, discount: item.discount, addedAt: item.addedAt })),
      })
    : await getWishlist()
  useWishlistStore.getState().replaceItems(toWishlistItems(items))
}

// On a page load that is already signed in: another browser may have changed
// the list since this one last saw it.
export async function loadAccountWishlist() {
  const items = await getWishlist()
  useWishlistStore.getState().replaceItems(toWishlistItems(items))
}

export function clearWishlist() {
  useWishlistStore.getState().clear()
}
