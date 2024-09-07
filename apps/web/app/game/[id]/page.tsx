'use client'

import { useGetGame } from '@repo/dionis-api/src/dionis/default/default'
import classes from '../../page.module.css'
import styles from './page.module.css'
import clsx from 'clsx'
import { ThemeState, useThemeState } from '@/providers/theme'
import { Loader } from '@/ui'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { calculateDiscountedPrice } from '../helpers'

export default function GamePage() {
  const { state } = useThemeState()
  const { id } = useParams()

  const { data, isLoading, error, isError } = useGetGame(Number(id))

  const {
    loaderStyles,
    containerStyles,
    infoStyles,
    topContainer,
    descriptionStyles,
    labelStyles,
    valueStyles,
    priceContainer,
    buttonsContainer,
    button,
  } = returnStyles(state)

  if (isLoading) {
    return (
      <div className={loaderStyles}>
        <Loader />
      </div>
    )
  }

  if (data) {
    const informationData = [
      { label: 'Genre', value: data.genre },
      { label: 'Platform', value: data.platform },
      { label: 'Publisher', value: data.publisher },
      { label: 'Developer', value: data.developer },
      { label: 'Release date', value: data.release_date },
    ]

    console.log(data)

    return (
      <div className={containerStyles}>
        <div className={topContainer}>
          <div>
            <Image
              alt={data.title as string}
              width={500}
              height={300}
              src={data.thumbnail as string}
            />
          </div>
          <div className={infoStyles}>
            <div className={descriptionStyles}>
              <h1>{data.title}</h1>

              <p>{data.short_description}</p>
            </div>
            <div className={buttonsContainer}>
              <div className={priceContainer}>
                <span>{data.price}€</span>
                <span>-{data.discount}%</span>
                <span>{calculateDiscountedPrice(data.price as number, data.discount as number)}€</span>
              </div>
              <div>
                <button className={button}>
                  <Image
                    width={24}
                    height={24}
                    alt='favorite'
                    src='/icons/favorite.svg'
                  />
                </button>
                <button className={button}>
                  <Image
                    width={24}
                    height={24}
                    alt='shopping-cart'
                    src='/icons/shopping-cart.svg'
                  />{' '}
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className={descriptionStyles}>
          {informationData.map((item) => (
            <div key={item.label}>
              <div className={labelStyles}>
                <span>{item.label}: </span>
              </div>
              <div className={valueStyles}>
                <span>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
}

function returnStyles(state: ThemeState) {
  const loaderStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)
  const containerStyles = clsx(styles.container, state.mode === 'light' ? classes.light : null)
  const infoStyles = clsx(styles.info, state.mode === 'light' ? classes.light : null)
  const topContainer = clsx(styles.topContainer, state.mode === 'light' ? classes.light : null)
  const descriptionStyles = clsx(styles.descriptionContainer, state.mode === 'light' ? classes.light : null)
  const labelStyles = clsx(styles.labelContainer, state.mode === 'light' ? classes.light : null)
  const valueStyles = clsx(styles.valueContainer, state.mode === 'light' ? classes.light : null)
  const priceContainer = clsx(styles.priceContainer, state.mode === 'light' ? classes.light : null)
  const buttonsContainer = clsx(styles.buttonsContainer)
  const button = clsx(styles.button)

  return {
    loaderStyles,
    containerStyles,
    infoStyles,
    topContainer,
    descriptionStyles,
    labelStyles,
    valueStyles,
    priceContainer,
    buttonsContainer,
    button,
  }
}
