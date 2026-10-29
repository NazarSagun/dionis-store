import { ReactNode } from 'react'
import Link from 'next/link'

import { GameObject } from '../../integration/repository'
import { GameCard } from '../game-card/GameCard'

export type GamesListGame = Pick<
  GameObject,
  'id' | 'title' | 'price' | 'rating' | 'platform' | 'thumbnail' | 'discount'
>

interface GamesListProps {
  gamesList: GamesListGame[]
  onAddToCart?: (game: GamesListGame) => void
  renderExtra?: (game: GamesListGame) => ReactNode
}

export const GamesList = ({ gamesList, onAddToCart, renderExtra }: GamesListProps) => {
  return (
    <div className='grid w-full grid-cols-1 gap-6 pb-20 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
      {gamesList.map((game) => (
        <Link key={game.id} href={`/game/${game.id}`} className='block h-full'>
          <GameCard
            id={game.id}
            title={game.title}
            price={game.price}
            rating={game.rating}
            platform={game.platform}
            imageSrc={game.thumbnail}
            discount={game.discount}
            onAddToCart={onAddToCart ? () => onAddToCart(game) : undefined}
            extraBadge={renderExtra?.(game)}
          />
        </Link>
      ))}
    </div>
  )
}
