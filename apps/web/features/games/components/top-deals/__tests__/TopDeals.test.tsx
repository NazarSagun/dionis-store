import { describe, expect, it } from 'vitest'
import { GameObject } from '@repo/dionis-api/src/model'

import { render } from '@/test-utils/utils'

import { TopDeals } from '../TopDeals'

const buildGame = (overrides: Partial<GameObject>): GameObject => ({
  id: 1,
  title: 'Some Game',
  thumbnail: 'https://www.freetogame.com/g/1/thumbnail.jpg',
  short_description: '',
  game_url: '',
  genre: '',
  platform: 'PC',
  publisher: '',
  developer: '',
  release_date: '',
  freetogame_profile_url: '',
  rating: '4.5',
  price: 20,
  discount: 0,
  ...overrides,
})

describe('<TopDeals />', () => {
  it('renders nothing when there are no discounted games', () => {
    const { container } = render(<TopDeals games={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the heading and a card per discounted game', () => {
    const games = [
      buildGame({ id: 1, title: 'Deal One', discount: 50 }),
      buildGame({ id: 2, title: 'Deal Two', discount: 30 }),
    ]

    const { getByText, getAllByTestId } = render(<TopDeals games={games} />)

    expect(getByText('Top Deals')).toBeInTheDocument()
    expect(getAllByTestId('card')).toHaveLength(2)
    expect(getAllByTestId('discount-badge')).toHaveLength(2)
  })
})
