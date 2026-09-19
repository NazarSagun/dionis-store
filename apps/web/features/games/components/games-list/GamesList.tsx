import Link from 'next/link'
import { GameObject } from '@repo/dionis-api/src/model'

import { GameCard } from '../game-card'

export type GamesListGame = Pick<
  GameObject,
  'id' | 'title' | 'price' | 'rating' | 'platform' | 'thumbnail' | 'discount'
>

interface GamesListProps {
  gamesList: GamesListGame[]
}

export const GamesList = ({ gamesList }: GamesListProps) => {
  return (
    <div className='grid w-full grid-cols-2 gap-6 pb-20 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
      {gamesList.map((game) => (
        <Link key={game.id} href={`/game/${game.id}`}>
          <GameCard
            id={game.id}
            title={game.title}
            price={game.price}
            rating={game.rating}
            platform={game.platform}
            imageSrc={game.thumbnail}
            discount={game.discount}
          />
        </Link>
      ))}
    </div>
  )
}
