import { cleanup, fireEvent, render } from '@/test-utils/utils'

import { describe, it, expect, vi, beforeEach } from 'vitest'

import { Button } from '../Button'

describe('<Button />', () => {
  beforeEach(() => {
    cleanup()
  })
  it('should handle click event', () => {
    const mockFn = vi.fn()
    const { getByTestId } = render(
      <Button
        variant='default'
        onClick={mockFn}
      />
    )

    const button = getByTestId('button')

    fireEvent.click(button)

    expect(mockFn).toHaveBeenCalled()
  })

  it('should not handle click event when disabled', () => {
    const mockFn = vi.fn()
    const { getByTestId } = render(
      <Button
        variant='default'
        onClick={mockFn}
        disabled
      />
    )

    const button = getByTestId('button')

    fireEvent.click(button)

    expect(mockFn).not.toHaveBeenCalled()
  })
  it('should render with correct label', () => {
    const { getByText } = render(<Button variant='default'>click</Button>)
    const button = getByText('click')
    expect(button).toBeTruthy()
  })
})
