import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useWishlistStore } from '@/modules/wishlist/core/store'
import { WishlistItem } from '@/modules/wishlist/domain/models'
import { render } from '@/test-utils/utils'

import { WishlistSection } from '../WishlistSection'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const buildItem = (overrides: Partial<WishlistItem>): WishlistItem => ({
  id: 1,
  title: 'Some Game',
  thumbnailUrl: 'https://www.freetogame.com/g/1/thumbnail.jpg',
  platform: 'PC',
  rating: '4.5',
  price: 20,
  discount: 0,
  addedAt: Date.now(),
  ...overrides,
})

describe('<WishlistSection />', () => {
  beforeEach(() => {
    useWishlistStore.setState({ items: [] })
  })

  it('renders an empty state prompting to browse games when the wishlist is empty', () => {
    const { getByTestId, getByText } = render(<WishlistSection />)

    expect(getByTestId('wishlist-empty')).toBeInTheDocument()
    expect(getByText('No games in your wishlist yet.')).toBeInTheDocument()
    expect(getByText('Browse games')).toBeInTheDocument()
  })

  it('renders the heading and a row per saved game', () => {
    useWishlistStore.setState({
      items: [buildItem({ id: 1, title: 'Saved One' }), buildItem({ id: 2, title: 'Saved Two' })],
    })

    const { getByText, getAllByTestId } = render(<WishlistSection />)

    expect(getByText('Wishlist')).toBeInTheDocument()
    expect(getAllByTestId('wishlist-row')).toHaveLength(2)
  })
})
