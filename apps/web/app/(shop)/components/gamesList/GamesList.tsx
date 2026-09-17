import { GameObject } from '@repo/dionis-api/src/model'
import { Card } from '@/ui/molecules'
import Link from 'next/link'

interface GamesListProps {
  gamesList: GameObject[]
}

export const GamesList = ({ gamesList }: GamesListProps) => {
  return (
    <div className='flex w-[60vw] flex-col justify-center gap-8 pb-20 pt-20'>
      {gamesList.map((game: GameObject) => (
        <Link
          key={game.id}
          href={`/game/${game.id}`}
        >
          <Card
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
