import Image from 'next/image'
import classes from './Card.module.css'
import clsx from 'clsx'
import { GamesArrayItem } from '@repo/dionis-api/src/model'
import { Item } from '@radix-ui/react-dropdown-menu'

type CardProps = Pick<GamesArrayItem, 'title' | 'short_description'>

export const Card = () => {
  const cardStyles = clsx(classes.container)

  return (
    <div className={cardStyles}>
      <Image
        width={270}
        height={150}
        alt='img'
        src='https://www.freetogame.com/g/540/thumbnail.jpg'
      />
      <h3>Main heading</h3>
      <span>Sub Heading</span>
      Lorem ipsum dolor sit, amet consectetur adipisicing elit!
    </div>
  )
}
