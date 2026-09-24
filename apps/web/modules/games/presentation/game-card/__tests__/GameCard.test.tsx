import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useWishlistStore } from '@/modules/wishlist/core/store'
import { cleanup, fireEvent, render } from '@/test-utils/utils'

import { GameCard, GameCardProps } from '../GameCard'

const game: GameCardProps = {
  title: 'Kings',
  price: 55,
  rating: '5',
  imageSrc: 'https://www.freetogame.com/g/540/thumbnail.jpg',
  platform: 'PC',
}

describe('<GameCard />', () => {
  beforeEach(() => {
    cleanup()
    useWishlistStore.setState({ items: [] })
  })
  it('Should render Card with correct data', () => {
    const { getByText } = render(
      <GameCard
        title={game.title}
        price={game.price}
        rating={game.rating}
        platform={game.platform}
        imageSrc={game.imageSrc}
      />,
    )

    const title = getByText(game.title)
    const price = getByText('€' + game.price)
    const platform = getByText(game.platform)

    expect(title).toBeInTheDocument()
    expect(price).toBeInTheDocument()
    expect(platform).toBeInTheDocument()
  })

  it('Should trigger a click on Card', () => {
    const mockFn = vi.fn()
    const { getByTestId } = render(
      <GameCard
        title={game.title}
        price={game.price}
        rating={game.rating}
        platform={game.platform}
        imageSrc={game.imageSrc}
        onClick={mockFn}
      />,
    )
    const card = getByTestId('card')

    fireEvent.click(card)

    expect(mockFn).toHaveBeenCalled()
  })

  it('Should render correct image', () => {
    const { getByAltText } = render(
      <GameCard
        title={game.title}
        price={game.price}
        rating={game.rating}
        platform={game.platform}
        imageSrc={game.imageSrc}
      />,
    )

    const image = getByAltText(game.title + ' thumbnail')

    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src')
  })

  it('Should not render a wishlist toggle when no id is given', () => {
    const { queryByTestId } = render(
      <GameCard
        title={game.title}
        price={game.price}
        rating={game.rating}
        platform={game.platform}
        imageSrc={game.imageSrc}
      />,
    )

    expect(queryByTestId('wishlist-toggle')).not.toBeInTheDocument()
  })

  it('Should toggle the game in and out of the wishlist without triggering the card click', () => {
    const mockFn = vi.fn()
    const { getByTestId } = render(
      <GameCard
        id={1}
        title={game.title}
        price={game.price}
        rating={game.rating}
        platform={game.platform}
        imageSrc={game.imageSrc}
        onClick={mockFn}
      />,
    )
    const toggle = getByTestId('wishlist-toggle')

    fireEvent.click(toggle)
    expect(useWishlistStore.getState().isInWishlist(1)).toBe(true)
    expect(mockFn).not.toHaveBeenCalled()

    fireEvent.click(toggle)
    expect(useWishlistStore.getState().isInWishlist(1)).toBe(false)
  })
})
