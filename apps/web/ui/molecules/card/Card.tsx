import Image from 'next/image'
import classes from './Card.module.css'
import clsx from 'clsx'
import { GamesArrayItem } from '@repo/dionis-api/src/model'
import { Item } from '@radix-ui/react-dropdown-menu'

type CardProps = Pick<GamesArrayItem, 'title' | 'short_description'>

export const Card = () => {
  const cardStyles = clsx(classes.container)
  const cardContentStyles = clsx(classes.content)

  return (
    <div className={cardStyles}>
      <Image
        style={{ borderRadius: '10px' }}
        width={270}
        height={150}
        alt='img'
        src='https://www.freetogame.com/g/540/thumbnail.jpg'
      />
      <div className={cardContentStyles}>
        <h3>Main heading</h3>
        <span>Lorem ipsum dolor sit, amet consectetur adipisicing elit!</span>
        <div>Rating: 4.5</div>
        <div>
          <span>EUR 25</span>
          <button>Add to cart</button>
        </div>
      </div>
    </div>
  )
}
