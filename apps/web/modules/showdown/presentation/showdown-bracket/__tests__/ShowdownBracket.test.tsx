import { act, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test-utils/utils'

import { PICK_TIMELINE } from '../../../configuration/constraints'
import { useShowdownStore } from '../../../core/store'
import { ShowdownGame } from '../../../domain/models'
import { ShowdownBracket } from '../ShowdownBracket'

const games: ShowdownGame[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  title: `Game ${i + 1}`,
  thumbnail: 'https://www.freetogame.com/g/1/thumbnail.jpg',
  genre: 'Shooter',
  platform: 'PC',
  rating: '4.0',
  price: 30,
  discount: 0,
}))

const mockReducedMotion = (matches: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia
}

describe('<ShowdownBracket />', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useShowdownStore.setState({ genres: ['Shooter'], size: 8 })
    useShowdownStore.getState().begin(games)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cracks, then shatters the other card, then shows the next match', () => {
    mockReducedMotion(false)
    render(<ShowdownBracket />)
    const progress = screen.getByTestId('showdown-progress')
    expect(progress).toHaveTextContent('Round 1 of 3 · Match 1 of 4')

    fireEvent.click(screen.getByRole('button', { name: 'Keep Game 1' }), { detail: 1, clientX: 10, clientY: 10 })
    expect(screen.queryByTestId('showdown-cracks')).not.toBeInTheDocument()

    void act(() => vi.advanceTimersByTime(PICK_TIMELINE.crack))
    expect(screen.getByTestId('showdown-cracks')).toBeInTheDocument()
    expect(screen.getByTestId('showdown-undo')).toBeDisabled()

    void act(() => vi.advanceTimersByTime(PICK_TIMELINE.shatter - PICK_TIMELINE.crack))
    expect(screen.queryByTestId('showdown-cracks')).not.toBeInTheDocument()
    expect(screen.getByTestId('showdown-shards')).toBeInTheDocument()

    void act(() => vi.advanceTimersByTime(PICK_TIMELINE.next - PICK_TIMELINE.shatter))
    expect(progress).toHaveTextContent('Round 1 of 3 · Match 2 of 4')
    expect(screen.queryByTestId('showdown-shards')).not.toBeInTheDocument()
    expect(screen.getByTestId('showdown-undo')).toBeDisabled()

    void act(() => vi.advanceTimersByTime(PICK_TIMELINE.done - PICK_TIMELINE.next))
    expect(screen.getByTestId('showdown-undo')).toBeEnabled()
    expect(useShowdownStore.getState().picks).toEqual([1])
  })

  it('skips the crack and the shatter when the system asks for reduced motion', () => {
    mockReducedMotion(true)
    render(<ShowdownBracket />)

    fireEvent.click(screen.getByRole('button', { name: 'Keep Game 2' }))
    void act(() => vi.advanceTimersByTime(200))

    expect(screen.queryByTestId('showdown-cracks')).not.toBeInTheDocument()
    expect(screen.queryByTestId('showdown-shards')).not.toBeInTheDocument()
    expect(useShowdownStore.getState().picks).toEqual([2])
    expect(screen.getByTestId('showdown-undo')).toBeEnabled()
  })

  it('does not show a price on a match card', () => {
    mockReducedMotion(false)
    render(<ShowdownBracket />)
    for (const card of screen.getAllByTestId('showdown-match-card')) expect(card).not.toHaveTextContent('€')
  })
})
