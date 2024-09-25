import { GameObject } from '@repo/dionis-api/src/model'
import clsx from 'clsx'
import classes from './GamesList.module.css'
import { Card } from '@/ui/molecules'
import Link from 'next/link'

interface GamesListProps {
  gamesList: GameObject[]
}

export const GamesList = ({ gamesList }: GamesListProps) => {
  const gamesListStyles = clsx(classes.container)
  return (
    <div className={gamesListStyles}>
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
