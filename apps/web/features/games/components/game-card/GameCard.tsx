import { useState } from 'react'
import Image from 'next/image'
import { GameObject } from '@repo/dionis-api/src/model'

export type GameCardProps = Pick<GameObject, 'title' | 'rating' | 'price' | 'platform'> & {
  onClick?: () => void
  imageSrc: string
}

export const GameCard = ({ title, rating, price, onClick, platform, imageSrc }: GameCardProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const onClickHandler = () => {
    onClick && onClick()
  }

  return (
    <div
      className='flex cursor-pointer rounded-lg border-2 border-ink bg-panel-alt text-foreground shadow-retro transition-transform duration-500 hover:-translate-y-[5px]'
      onClick={onClickHandler}
      data-testid='card'
    >
      <Image
        onLoadingComplete={() => setIsImageLoaded(true)}
        priority={true}
        style={{
          borderRadius: '0.4em 0 0 0.4em',
        }}
        width={isImageLoaded ? 200 : 0}
        height={isImageLoaded ? 250 : 0}
        alt={`${title} thumbnail`}
        src={imageSrc}
        data-testid='image'
      />
      {!isImageLoaded && (
        <div className='h-[112px] w-[200px] animate-shimmer rounded-lg bg-[length:200%_100%] bg-gradient-to-r from-[#313131] from-25% via-[#5a5a5a] via-50% to-[#303030] to-75%' />
      )}
      <div className='flex w-full justify-between px-4 py-2'>
        <div className='flex max-w-[15rem] flex-col items-start overflow-hidden'>
          <h3 className='max-w-[13rem] truncate font-mono text-xl font-bold'>{title}</h3>
          <span className='font-mono text-sm text-muted-foreground'>{platform}</span>
        </div>
        <div className='flex items-center'>
          <span className='rounded border-2 border-ink bg-neon-green p-[3px] font-mono text-sm font-bold text-ink'>
            {rating}
          </span>
          <div className='ml-4'>
            <span className='font-display text-lg text-neon-magenta'>€{price}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
