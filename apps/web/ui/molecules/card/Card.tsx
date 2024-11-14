import Image from 'next/image'
import classes from './Card.module.css'
import { GameObject } from '@repo/dionis-api/src/model'
import { useState } from 'react'

export type CardProps = Pick<GameObject, 'title' | 'rating' | 'price' | 'platform'> & {
  onClick?: () => void
  imageSrc: string
}

export const Card = ({ title, rating, price, onClick, platform, imageSrc }: CardProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const onClickHandler = () => {
    onClick && onClick()
  }

  const loader = () => {
    return <div className={classes.placeholder} />
  }

  return (
    <div
      className={classes.card}
      onClick={onClickHandler}
      data-testid='card'
    >
      <Image
        onLoadingComplete={() => setIsImageLoaded(true)}
        priority={true}
        style={{
          borderRadius: '1.2em',
        }}
        width={isImageLoaded ? 200 : 0}
        height={isImageLoaded ? 250 : 0}
        alt={`${title} thumbnail`}
        src={imageSrc}
        data-testid='image'
      />
      {!isImageLoaded && <div className={classes.placeholder} />}
      <div className={classes.content}>
        <div className={classes.titleContainer}>
          <h3>{title}</h3>
          <span>{platform}</span>
        </div>
        <div className={classes.priceContainer}>
          <span className={classes.rating}>{rating}</span>
          <div>
            <span>€{price}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
