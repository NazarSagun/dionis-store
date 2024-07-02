import { GamesArray, GamesArrayItem } from '@repo/dionis-api/src/model'
import clsx from 'clsx'
import classes from './GamesList.module.css'

interface GamesListProps {
  gamesList: GamesArray
}

export const GamesList = ({ gamesList }: GamesListProps) => {
  const gamesListStyles = clsx(classes.container)
  return (
    <div className={gamesListStyles}>
      {gamesList.map((game: GamesArrayItem) => (
        <div key={game.id}>{game.id}</div>
      ))}
    </div>
  )
}
