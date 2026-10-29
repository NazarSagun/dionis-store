import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { render, screen } from '@/test-utils/utils'

import { GameGallery } from '../GameGallery'

const images = [1, 2, 3].map((n) => ({
  url: `https://media.test/games/1/${n}.jpg`,
  alt: `Hades image ${n}`,
  position: n - 1,
}))
const mainImageAlt = () => screen.getByTestId('gallery-main-image').querySelector('img')?.getAttribute('alt')

describe('<GameGallery />', () => {
  it('starts on the trailer poster and loads the player only after a click', async () => {
    render(<GameGallery title='Hades' thumbnail='' images={images} trailerYoutubeId='dQw4w9WgXcQ' />)

    expect(screen.getAllByTestId('gallery-thumb')[0]).toHaveAttribute('data-kind', 'video')
    expect(screen.getByTestId('gallery-counter')).toHaveTextContent('1 / 4')
    expect(screen.queryByTestId('trailer-frame')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('trailer-play'))

    expect(screen.getByTestId('trailer-frame')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1',
    )
    expect(screen.getByTestId('trailer-frame')).toHaveAttribute('title', 'Hades trailer')
  })

  it('stops the trailer on next, and wraps from the last item back to the first', async () => {
    render(<GameGallery title='Hades' thumbnail='' images={images} trailerYoutubeId='dQw4w9WgXcQ' />)
    await userEvent.click(screen.getByTestId('trailer-play'))

    await userEvent.click(screen.getByTestId('gallery-next'))
    expect(screen.queryByTestId('trailer-frame')).not.toBeInTheDocument()
    expect(mainImageAlt()).toBe('Hades image 1')

    await userEvent.click(screen.getAllByTestId('gallery-thumb')[3])
    expect(mainImageAlt()).toBe('Hades image 3')
    await userEvent.click(screen.getByTestId('gallery-next'))
    expect(screen.getByTestId('trailer-play')).toBeInTheDocument()
  })

  it('starts on the first image without a trailer, and shows the thumbnail with neither', () => {
    const { unmount } = render(<GameGallery title='Hades' thumbnail='' images={images} />)
    expect(mainImageAlt()).toBe('Hades image 1')
    expect(screen.queryByTestId('trailer-play')).not.toBeInTheDocument()
    unmount()

    render(<GameGallery title='Hades' thumbnail='https://media.test/thumb.jpg' images={[]} />)
    expect(screen.queryByTestId('game-gallery')).not.toBeInTheDocument()
    expect(screen.getByAltText('Hades')).toBeInTheDocument()
  })
})
