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
      className='flex w-full cursor-pointer flex-col overflow-hidden rounded-lg border-2 border-ink bg-panel-alt text-foreground shadow-retro transition-transform duration-500 hover:-translate-y-[5px]'
      onClick={onClickHandler}
      data-testid='card'
    >
      <div className='relative aspect-[4/3] w-full shrink-0'>
        <Image
          onLoad={() => setIsImageLoaded(true)}
          priority={true}
          fill
          sizes='(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw'
          style={{ objectFit: 'cover' }}
          alt={`${title} thumbnail`}
          src={imageSrc}
          data-testid='image'
        />
        {!isImageLoaded && (
          <div className='absolute inset-0 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-[#313131] from-25% via-[#5a5a5a] via-50% to-[#303030] to-75%' />
        )}
      </div>
      <div className='flex min-w-0 flex-col gap-2 p-4'>
        <h3 className='w-full truncate font-mono text-lg font-bold'>{title}</h3>
        <span className='font-mono text-sm text-muted-foreground'>{platform}</span>
        <div className='flex items-center justify-between pt-1'>
          <span className='rounded border-2 border-ink bg-neon-green p-[3px] font-mono text-sm font-bold text-ink'>
            {rating}
          </span>
          <span className='font-display text-lg text-neon-magenta'>€{price}</span>
        </div>
      </div>
    </div>
  )
}
