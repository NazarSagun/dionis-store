import Image from 'next/image'
import classes from './Card.module.css'
import clsx from 'clsx'
import { GamesArrayItem } from '@repo/dionis-api/src/model'

type CardProps = Pick<GamesArrayItem, 'title' | 'rating' | 'price' | 'platform'> & {
  onClick?: () => void
  imageSrc: string
}

interface Card {}

export const Card = ({ title, rating, price, onClick, platform, imageSrc }: CardProps) => {
  const containerStyles = clsx(classes.card)
  const contentStyles = clsx(classes.content)
  const contentWrapperStyles = clsx(classes.contentWrapper)
  const priceContainerStyles = clsx(classes.priceContainer)
  const titleContainerStyles = clsx(classes.titleContainer)
  const ratingStyles = clsx(classes.rating)

  const onClickHandler = () => {
    onClick && onClick()
  }

  return (
    <div
      className={containerStyles}
      onClick={onClickHandler}
    >
      <Image
        priority={true}
        style={{ borderTopLeftRadius: '1.2em', borderTopRightRadius: '1.2em', width: 270, height: 150 }}
        width={270}
        height={150}
        alt='img'
        src={imageSrc}
      />
      <div className={contentStyles}>
        <div className={contentWrapperStyles}>
          <div className={titleContainerStyles}>
            <h3>{title}</h3>
            <span>{platform}</span>
          </div>
          <span className={ratingStyles}>{rating}</span>
        </div>
        <div className={priceContainerStyles}>
          <span>€{price}</span>
        </div>
      </div>
    </div>
  )
}
