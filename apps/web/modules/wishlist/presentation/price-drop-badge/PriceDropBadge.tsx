'use client'

import { useEffect, useState } from 'react'

import { useUpdateWishlistDiscountSnapshot } from '../../core/facade'
import { useGetGame } from '../../integration/repository'

interface PriceDropBadgeProps {
  gameId: number
  snapshotDiscount: number
}

// Whether the badge shows is decided once, the first time the current
// discount is known, and frozen from then on. `updateDiscountSnapshot` writes
// the new discount back into the wishlist item right after that decision, so
// a naive live comparison would make the badge vanish in the same render it
// appeared in. Freezing the decision is what makes it show for this visit and
// stay gone on the next one, per account-area-spec.md Feature 8.
export const PriceDropBadge = ({ gameId, snapshotDiscount }: PriceDropBadgeProps) => {
  const { data } = useGetGame(gameId)
  const updateDiscountSnapshot = useUpdateWishlistDiscountSnapshot()
  const [shouldShow, setShouldShow] = useState<boolean | null>(null)

  useEffect(() => {
    if (data?.discount === undefined || shouldShow !== null) return

    const droppedFurther = data.discount > snapshotDiscount
    setShouldShow(droppedFurther)
    if (droppedFurther) {
      void updateDiscountSnapshot(gameId, data.discount)
    }
    // Runs once, off of the first resolved discount value: the shouldShow
    // guard above stops any later run, including the one that the snapshot
    // update itself triggers.
  }, [data?.discount, shouldShow, snapshotDiscount, gameId, updateDiscountSnapshot])

  if (!shouldShow) return null

  return (
    <span
      data-testid='wishlist-price-drop-badge'
      className='w-fit rounded-full border border-success bg-panel-alt px-3 py-1 font-sans text-xs font-semibold text-success'
    >
      Price Dropped
    </span>
  )
}
