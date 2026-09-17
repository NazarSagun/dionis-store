import Link from 'next/link'
import { GameObject } from '@repo/dionis-api/src/model'

import { GameCard } from '../game-card'

interface GamesListProps {
  gamesList: GameObject[]
}

export const GamesList = ({ gamesList }: GamesListProps) => {
  return (
    <div className='flex w-[80vw] max-w-[1400px] flex-wrap justify-center gap-7 pb-20 pt-20'>
      {gamesList.map((game: GameObject) => (
        <Link key={game.id} href={`/game/${game.id}`}>
          <GameCard
            title={game.title}
            price={game.price}
            rating={game.rating}
            platform={game.platform}
            imageSrc={game.thumbnail}
          />
        </Link>
      ))}
    </div>
  )
}
