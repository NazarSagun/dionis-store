import Link from 'next/link'
import { GameObject } from '@repo/dionis-api/src/model'

import { GameCard } from '../game-card'

interface GamesListProps {
  gamesList: GameObject[]
  showDiscount?: boolean
}

export const GamesList = ({ gamesList, showDiscount = false }: GamesListProps) => {
  return (
    <div className='grid w-full grid-cols-2 gap-6 pb-20 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
      {gamesList.map((game: GameObject) => (
        <Link key={game.id} href={`/game/${game.id}`}>
          <GameCard
            title={game.title}
            price={game.price}
            rating={game.rating}
            platform={game.platform}
            imageSrc={game.thumbnail}
            discount={showDiscount ? game.discount : undefined}
          />
        </Link>
      ))}
    </div>
  )
}
