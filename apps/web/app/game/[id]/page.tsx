'use client'

import { useGetGame } from '@repo/dionis-api/src/dionis/default/default'
import classes from '../../page.module.css'
import styles from './page.module.css'
import clsx from 'clsx'
import { useThemeState } from '@/providers/theme'
import { Loader } from '@/ui'
import Image from 'next/image'
import { useParams } from 'next/navigation'

export default function GamePage() {
  const { state } = useThemeState()
  const { id } = useParams()

  const { data, isLoading, error, isError } = useGetGame(Number(id))

  const loaderStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)
  const containerStyles = clsx(styles.container, state.mode === 'light' ? classes.light : null)
  const infoStyles = clsx(styles.info, state.mode === 'light' ? classes.light : null)

  if (isLoading) {
    return (
      <div className={loaderStyles}>
        <Loader />
      </div>
    )
  }

  if (data) {
    const informationData = [
      { label: 'Title', value: data.title },
      { label: 'Genre', value: data.genre },
      { label: 'Platform', value: data.platform },
      { label: 'Publisher', value: data.publisher },
    ]

    return (
      <div className={containerStyles}>
        <div>
          <Image
            alt={data.title as string}
            width={500}
            height={300}
            src={data.thumbnail as string}
          />
        </div>
        <div className={infoStyles}>
          <h1>Description</h1>

          <p>{data.short_description}</p>

          {informationData.map((item) => (
            <div key={item.label}>
              <span>{item.label}: </span>
              <h2>{item.value}</h2>
            </div>
          ))}
        </div>
      </div>
    )
  }
}
