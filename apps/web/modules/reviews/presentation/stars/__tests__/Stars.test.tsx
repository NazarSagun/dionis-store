import { describe, expect, it } from 'vitest'

import { render } from '@/test-utils/utils'

import { Stars } from '../Stars'

describe('<Stars />', () => {
  it('names the rating for a screen reader', () => {
    const { getByTestId } = render(<Stars rating={4} />)

    expect(getByTestId('review-stars')).toHaveAttribute('aria-label', '4 out of 5 stars')
  })

  it('draws five stars', () => {
    const { getByTestId } = render(<Stars rating={4.5} />)

    expect(getByTestId('review-stars').querySelectorAll('svg')).toHaveLength(5)
  })
})
