import { describe, expect, it } from 'vitest'

import { render, screen } from '@/test-utils/utils'

import { GameLanguages } from '../GameLanguages'

describe('<GameLanguages />', () => {
  it('lists each language with its interface, audio, and subtitle support', () => {
    render(
      <GameLanguages
        languages={[
          { language: 'English', audio: true, subtitles: true, interface: true },
          { language: 'French', audio: false, subtitles: true, interface: true },
        ]}
      />,
    )

    const rows = screen.getAllByTestId('language-row')
    expect(rows).toHaveLength(2)
    expect(rows[1]).toHaveTextContent('French✓Yes–No✓Yes')
  })

  it('renders nothing without languages', () => {
    render(<GameLanguages languages={[]} />)
    expect(screen.queryByTestId('game-languages')).not.toBeInTheDocument()
  })
})
