import Image from 'next/image'
import { GameObject } from '@repo/dionis-api/src/model'
import { useState } from 'react'

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
      className='flex cursor-pointer rounded-[1.2em] bg-gradient-to-b from-[#36076b] from-10% to-[#2f243a] to-70% text-white shadow-[0px_2px_8px_0px_rgba(96,0,252,0.459)] transition-transform duration-500 hover:-translate-y-[5px]'
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
      {!isImageLoaded && (
        <div className='h-[112px] w-[200px] animate-shimmer rounded-lg bg-[length:200%_100%] bg-gradient-to-r from-[#313131] from-25% via-[#5a5a5a] via-50% to-[#303030] to-75%' />
      )}
      <div className='flex w-full justify-between px-4 py-2'>
        <div className='flex max-w-[15rem] flex-col items-start overflow-hidden'>
          <h3 className='max-w-[13rem] truncate text-xl font-normal'>{title}</h3>
          <span className='text-sm font-normal'>{platform}</span>
        </div>
        <div className='flex items-center'>
          <span className='bg-[#04ff4b75] p-[3px] text-xl font-normal'>{rating}</span>
          <div className='ml-4'>
            <span className='text-xl font-normal'>€{price}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
