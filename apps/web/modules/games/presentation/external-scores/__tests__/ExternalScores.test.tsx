import { describe, expect, it } from 'vitest'

import { render, screen } from '@/test-utils/utils'

import { ExternalScores } from '../ExternalScores'

describe('<ExternalScores />', () => {
  it('shows the critic and player scores with their counts', () => {
    render(<ExternalScores criticRating={94} criticRatingCount={17} userRating={89} userRatingCount={1779} />)

    expect(screen.getByTestId('critic-score')).toHaveTextContent('94Criticsout of 100, 17 reviews')
    expect(screen.getByTestId('user-score')).toHaveTextContent('89IGDB playersout of 100, 1,779 ratings')
  })

  it('leaves out a missing score, and renders nothing without either', () => {
    const { unmount } = render(
      <ExternalScores criticRating={null} criticRatingCount={null} userRating={70} userRatingCount={1} />,
    )
    expect(screen.queryByTestId('critic-score')).not.toBeInTheDocument()
    expect(screen.getByTestId('user-score')).toHaveTextContent('1 rating')
    unmount()

    render(<ExternalScores criticRating={null} criticRatingCount={null} userRating={null} userRatingCount={null} />)
    expect(screen.queryByTestId('external-scores')).not.toBeInTheDocument()
  })
})
