import { useEffect } from 'react'
import { act, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test-utils/utils'

import { PICK_TIMELINE, THROW_TIMELINE } from '../../../configuration/constraints'
import { useShowdownStore } from '../../../core/store'
import { ShowdownGame, ThrowAction } from '../../../domain/models'
import { ShowdownBracket } from '../ShowdownBracket'

// A stand-in for Grumli that reports itself loaded, so the bracket uses the throw timeline.
const stage = vi.hoisted(() => ({ props: [] as Array<{ throwAction: ThrowAction | null }> }))
vi.mock('../../dwarf/DwarfStage', () => ({
  DwarfStage: (props: { throwAction: ThrowAction | null; onReady?: () => void }) => {
    stage.props.push(props)
    useEffect(() => props.onReady?.(), [props])
    return <div data-testid='showdown-character' />
  },
}))

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

describe('<ShowdownBracket /> with Grumli', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
    stage.props = []
    useShowdownStore.setState({ genres: ['Shooter'], size: 8 })
    useShowdownStore.getState().begin(games)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('throws at the other card, and cracks it when the rock lands', () => {
    render(<ShowdownBracket />)
    fireEvent.click(screen.getByRole('button', { name: 'Keep Game 1' }), { detail: 1, clientX: 10, clientY: 10 })

    const last = stage.props[stage.props.length - 1]
    expect(last.throwAction?.facing).toBe(1)
    expect(last.throwAction?.phrase.title).toBe('Game 1')

    // The crack waits for the rock, not for the shorter timeline without the character.
    void act(() => vi.advanceTimersByTime(PICK_TIMELINE.crack))
    expect(screen.queryByTestId('showdown-cracks')).not.toBeInTheDocument()
    void act(() => vi.advanceTimersByTime(THROW_TIMELINE.crack - PICK_TIMELINE.crack))
    expect(screen.getByTestId('showdown-cracks')).toBeInTheDocument()

    void act(() => vi.advanceTimersByTime(THROW_TIMELINE.done - THROW_TIMELINE.crack))
    expect(screen.getByTestId('showdown-progress')).toHaveTextContent('Match 2 of 4')
    expect(screen.getByTestId('showdown-undo')).toBeEnabled()
  })

  it('faces left when the left card loses', () => {
    render(<ShowdownBracket />)
    fireEvent.click(screen.getByRole('button', { name: 'Keep Game 2' }), { detail: 1, clientX: 10, clientY: 10 })
    expect(stage.props[stage.props.length - 1].throwAction?.facing).toBe(-1)
  })
})
