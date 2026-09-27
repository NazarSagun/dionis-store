'use client'

import Link from 'next/link'

import { GameCard } from '@/modules/games/presentation/game-card/GameCard'

import { useRecentlyViewedGameIds } from '../../core/facade'
import { useGetGame } from '../../integration/repository'

const RecentlyViewedCard = ({ gameId }: { gameId: number }) => {
  const { data } = useGetGame(gameId)

  if (!data) return null

  return (
    <Link href={`/game/${data.id}`}>
      <GameCard
        id={data.id}
        title={data.title}
        price={data.price}
        rating={data.rating}
        platform={data.platform}
        imageSrc={data.thumbnail}
        discount={data.discount}
      />
    </Link>
  )
}

export const RecentlyViewedSection = () => {
  const gameIds = useRecentlyViewedGameIds()

  if (gameIds.length === 0) {
    return null
  }

  return (
    <div data-testid='recently-viewed' className='flex w-full flex-col gap-4'>
      <h2 className='font-display text-lg font-medium text-foreground'>Recently Viewed</h2>
      <div className='grid w-full grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(200px,248px))]'>
        {gameIds.map((gameId) => (
          <RecentlyViewedCard key={gameId} gameId={gameId} />
        ))}
      </div>
    </div>
  )
}
