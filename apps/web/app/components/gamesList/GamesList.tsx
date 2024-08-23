import { GamesArray, GamesArrayItem } from '@repo/dionis-api/src/model'
import clsx from 'clsx'
import classes from './GamesList.module.css'
import { Card } from '@/ui/molecules'

interface GamesListProps {
  gamesList: GamesArray
}

export const GamesList = ({ gamesList }: GamesListProps) => {
  const gamesListStyles = clsx(classes.container)
  return (
    <div className={gamesListStyles}>
      {gamesList.map((game: GamesArrayItem) => (
        <Card
          key={game.id}
          title={game.title}
          price={game.price}
          rating={game.rating}
          platform={game.platform}
          imageSrc={game.thumbnail as string}
        />
      ))}
    </div>
  )
}
