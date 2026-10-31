import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test-utils/utils'

import { DWARF_CLIP_MS, THROW_TIMELINE } from '../../../configuration/constraints'
import { DwarfStage } from '../DwarfStage'

const mockWebGL = (isAvailable: boolean) => {
  if (isAvailable) vi.stubGlobal('WebGLRenderingContext', class {})
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    isAvailable ? ({ getExtension: () => null } as unknown as RenderingContext) : null,
  )
}

const mockReducedMotion = (matches: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia
}

const throwAt = (facing: 1 | -1) => ({
  startedAt: 1,
  facing,
  target: { x: 0, y: 0 },
  phrase: { before: 'By my beard, ', title: 'Paper Fortress', after: ' it is!' },
})

describe('<DwarfStage />', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockReducedMotion(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows nothing without WebGL', () => {
    mockWebGL(false)
    render(<DwarfStage screen='greet' className='relative h-10' />)
    expect(screen.queryByTestId('showdown-character')).not.toBeInTheDocument()
  })

  it('greets, then goes idle', () => {
    mockWebGL(true)
    render(<DwarfStage screen='greet' className='relative h-10' />)
    const stage = screen.getByTestId('showdown-character')
    expect(stage).toHaveAttribute('data-pose', 'greet')

    void act(() => vi.advanceTimersByTime(DWARF_CLIP_MS.greet))
    expect(stage).toHaveAttribute('data-pose', 'idle')
  })

  it('holds the screen pose under reduced motion', () => {
    mockWebGL(true)
    mockReducedMotion(true)
    render(<DwarfStage screen='celebrate' className='relative h-10' />)

    void act(() => vi.advanceTimersByTime(DWARF_CLIP_MS.celebrate))
    expect(screen.getByTestId('showdown-character')).toHaveAttribute('data-pose', 'celebrate')
  })

  it('says the kept game during a throw, then fades it out', () => {
    mockWebGL(true)
    render(<DwarfStage screen='idle' overlay className='h-10' throwAction={throwAt(1)} />)
    expect(screen.getByTestId('showdown-character')).toHaveAttribute('data-pose', 'throw')
    expect(screen.getByTestId('showdown-character-phrase')).toHaveTextContent('By my beard, Paper Fortress it is!')

    void act(() => vi.advanceTimersByTime(THROW_TIMELINE.phraseOut))
    expect(screen.getByTestId('showdown-character-phrase')).toHaveClass('opacity-0')

    void act(() => vi.advanceTimersByTime(THROW_TIMELINE.phraseEnd - THROW_TIMELINE.phraseOut))
    expect(screen.queryByTestId('showdown-character-phrase')).not.toBeInTheDocument()
  })

  it('keeps the bubble for 2 s after the bracket clears the throw, and goes idle', () => {
    mockWebGL(true)
    const { rerender } = render(<DwarfStage screen='idle' overlay className='h-10' throwAction={throwAt(1)} />)
    void act(() => vi.advanceTimersByTime(THROW_TIMELINE.done))
    rerender(<DwarfStage screen='idle' overlay className='h-10' throwAction={null} />)

    expect(screen.getByTestId('showdown-character')).toHaveAttribute('data-pose', 'idle')
    expect(screen.getByTestId('showdown-character-phrase')).toBeInTheDocument()

    void act(() => vi.advanceTimersByTime(THROW_TIMELINE.phraseEnd - THROW_TIMELINE.done))
    expect(screen.queryByTestId('showdown-character-phrase')).not.toBeInTheDocument()
  })

  it('puts the bubble on the side away from the losing card', () => {
    mockWebGL(true)
    render(<DwarfStage screen='idle' overlay className='h-10' throwAction={throwAt(-1)} />)
    expect(screen.getByTestId('showdown-character-phrase').className).toContain('md:left-[calc(50%+64px)]')
  })

  it('shows no bubble under reduced motion', () => {
    mockWebGL(true)
    mockReducedMotion(true)
    render(<DwarfStage screen='idle' overlay className='h-10' throwAction={throwAt(1)} />)
    expect(screen.queryByTestId('showdown-character-phrase')).not.toBeInTheDocument()
  })
})
