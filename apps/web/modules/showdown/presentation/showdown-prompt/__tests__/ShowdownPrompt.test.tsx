import { act, fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test-utils/utils'

import { PROMPT_DELAY_MS } from '../../../configuration/constraints'
import { useShowdownPromptStore } from '../../../core/store'
import { ShowdownPrompt } from '../ShowdownPrompt'

describe('<ShowdownPrompt />', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('appears after the delay, and "Not now" hides it for good', () => {
    const { unmount } = render(<ShowdownPrompt />)
    expect(screen.queryByTestId('showdown-prompt')).not.toBeInTheDocument()

    void act(() => vi.advanceTimersByTime(PROMPT_DELAY_MS))
    expect(screen.getByTestId('showdown-prompt')).toHaveTextContent(
      "Don't know what to play? Start a Showdown and figure it out.",
    )

    fireEvent.click(screen.getByTestId('showdown-prompt-dismiss'))
    expect(screen.queryByTestId('showdown-prompt')).not.toBeInTheDocument()
    expect(useShowdownPromptStore.getState().seen).toBe(true)

    unmount()
    render(<ShowdownPrompt />)
    void act(() => vi.advanceTimersByTime(PROMPT_DELAY_MS))
    expect(screen.queryByTestId('showdown-prompt')).not.toBeInTheDocument()
  })
})
