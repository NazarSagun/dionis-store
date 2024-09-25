import Image from 'next/image'
import classes from './Card.module.css'
import clsx from 'clsx'
import { GameObject } from '@repo/dionis-api/src/model'
import { useState } from 'react'
// import { fontSans } from '@/app/layout'

export type CardProps = Pick<GameObject, 'title' | 'rating' | 'price' | 'platform'> & {
  onClick?: () => void
  imageSrc: string
}

export const Card = ({ title, rating, price, onClick, platform, imageSrc }: CardProps) => {
  const onClickHandler = () => {
    onClick && onClick()
  }

  return (
    <div
      className={classes.card}
      onClick={onClickHandler}
      data-testid='card'
    >
      <Image
        priority={true}
        style={{ borderTopLeftRadius: '1.2em', borderTopRightRadius: '1.2em', width: 'auto', height: 'auto' }}
        width={500}
        height={270}
        alt={`${title} thumbnail`}
        src={imageSrc}
        data-testid='image'
      />
      <div className={classes.content}>
        <div className={classes.contentWrapper}>
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
    </div>
  )
}
