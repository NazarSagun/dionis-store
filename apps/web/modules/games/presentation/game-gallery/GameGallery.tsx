'use client'

import { useState } from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

import { GameImage } from '../../integration/repository'

type GalleryItem = { kind: 'video'; youtubeId: string } | ({ kind: 'image' } & GameImage)

interface GameGalleryProps {
  title: string
  thumbnail: string
  images: GameImage[]
  trailerYoutubeId?: string | null
}

const posterUrl = (youtubeId: string) => `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`

const navButton =
  'absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink bg-background/80 font-mono text-lg text-foreground transition-colors hover:bg-background'

// The trailer is the first item (rich-game-details-spec.md, Feature 4). The
// YouTube player loads only after a click, and moving away removes it.
export const GameGallery = ({ title, thumbnail, images, trailerYoutubeId }: GameGalleryProps) => {
  const items: GalleryItem[] = [
    ...(trailerYoutubeId ? [{ kind: 'video' as const, youtubeId: trailerYoutubeId }] : []),
    ...images.map((image) => ({ kind: 'image' as const, ...image })),
  ]
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  if (items.length === 0) {
    return (
      <div className='w-full max-w-[500px] shrink-0'>
        <Image className='h-auto w-full rounded-md' alt={title} width={500} height={300} src={thumbnail} />
      </div>
    )
  }

  const show = (next: number) => {
    setIsPlaying(false)
    setIndex((next + items.length) % items.length)
  }
  const current = items[index]

  return (
    <div data-testid='game-gallery' className='flex w-full max-w-[500px] shrink-0 flex-col gap-3'>
      <div
        data-testid='gallery-main-image'
        className='relative aspect-video w-full overflow-hidden rounded-md border border-ink bg-panel-alt'
      >
        {current.kind === 'image' && (
          <Image
            src={current.url}
            alt={current.alt}
            fill
            sizes='(min-width: 1024px) 500px, 100vw'
            className='object-cover'
          />
        )}
        {current.kind === 'video' && isPlaying && (
          <iframe
            data-testid='trailer-frame'
            className='absolute inset-0 h-full w-full'
            src={`https://www.youtube-nocookie.com/embed/${current.youtubeId}?autoplay=1`}
            title={`${title} trailer`}
            allow='autoplay; encrypted-media; picture-in-picture'
            allowFullScreen
          />
        )}
        {current.kind === 'video' && !isPlaying && (
          <>
            <Image
              src={posterUrl(current.youtubeId)}
              alt={`${title} trailer`}
              fill
              sizes='500px'
              className='object-cover'
            />
            <div className='absolute inset-0 bg-background/20' />
            <button
              type='button'
              data-testid='trailer-play'
              onClick={() => setIsPlaying(true)}
              className='absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-md bg-primary px-6 py-3 font-mono text-base text-primary-foreground shadow-retro'
            >
              <span aria-hidden='true'>▶</span>
              Play trailer
            </button>
            <span className='absolute bottom-2 left-3 font-mono text-[11px] text-muted-foreground'>
              Plays from youtube-nocookie.com
            </span>
          </>
        )}
        {items.length > 1 && (
          <>
            <button
              type='button'
              data-testid='gallery-prev'
              aria-label='Previous item'
              onClick={() => show(index - 1)}
              className={cn(navButton, 'left-3')}
            >
              ‹
            </button>
            <button
              type='button'
              data-testid='gallery-next'
              aria-label='Next item'
              onClick={() => show(index + 1)}
              className={cn(navButton, 'right-3')}
            >
              ›
            </button>
          </>
        )}
        <span
          data-testid='gallery-counter'
          className='absolute bottom-2 right-3 rounded bg-background/80 px-2 py-1 font-mono text-xs text-foreground'
        >
          {index + 1} / {items.length}
        </span>
      </div>

      {items.length > 1 && (
        <ul className='grid grid-cols-4 gap-2 sm:gap-3'>
          {items.map((item, itemIndex) => (
            <li key={item.kind === 'video' ? 'trailer' : item.position}>
              <button
                type='button'
                data-testid='gallery-thumb'
                data-kind={item.kind}
                aria-label={item.kind === 'video' ? `${title} trailer` : item.alt}
                aria-current={itemIndex === index}
                onClick={() => show(itemIndex)}
                className={cn(
                  'relative block aspect-video w-full overflow-hidden rounded border border-ink transition-opacity',
                  itemIndex === index ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100',
                )}
              >
                <Image
                  src={item.kind === 'video' ? posterUrl(item.youtubeId) : item.url}
                  alt=''
                  fill
                  sizes='120px'
                  className='object-cover'
                />
                {item.kind === 'video' && (
                  <span
                    aria-hidden='true'
                    className='absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary pl-0.5 text-[10px] text-primary-foreground'
                  >
                    ▶
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
