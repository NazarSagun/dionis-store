import { GameObject } from '@repo/dionis-api/src/model'

import { GamesList } from '../games-list'

interface TopDealsProps {
  games: GameObject[]
}

export const TopDeals = ({ games }: TopDealsProps) => {
  if (games.length === 0) {
    return null
  }

  return (
    <div data-testid='top-deals' className='w-full'>
      <h2 className='w-full pt-16 text-center font-display text-xl uppercase text-neon-magenta'>Top Deals</h2>
      <div className='w-full pt-10'>
        <GamesList gamesList={games} showDiscount />
      </div>
    </div>
  )
}
