import { GameObject } from '@repo/dionis-api/src/model'
import { describe, expect, it } from 'vitest'

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
  it('renders nothing when there are no top deals', () => {
    const { container } = render(<TopDeals games={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the heading and the first game as the featured deal', () => {
    const games = [buildGame({ id: 1, title: 'Deal One', price: 59 })]

    const { getByText, getByTestId, queryAllByTestId } = render(<TopDeals games={games} />)

    expect(getByText('Top Deals')).toBeInTheDocument()
    expect(getByTestId('featured-deal')).toBeInTheDocument()
    expect(getByText('Deal One')).toBeInTheDocument()
    expect(getByText('€59')).toBeInTheDocument()
    expect(queryAllByTestId('next-up-row')).toHaveLength(0)
  })

  it('renders up to three remaining games in the next up rail', () => {
    const games = [
      buildGame({ id: 1, title: 'Deal One' }),
      buildGame({ id: 2, title: 'Deal Two' }),
      buildGame({ id: 3, title: 'Deal Three' }),
      buildGame({ id: 4, title: 'Deal Four' }),
      buildGame({ id: 5, title: 'Deal Five' }),
    ]

    const { getAllByTestId, getByText } = render(<TopDeals games={games} />)

    expect(getAllByTestId('next-up-row')).toHaveLength(3)
    expect(getByText('Deal Two')).toBeInTheDocument()
    expect(getByText('Deal Three')).toBeInTheDocument()
    expect(getByText('Deal Four')).toBeInTheDocument()
  })
})
