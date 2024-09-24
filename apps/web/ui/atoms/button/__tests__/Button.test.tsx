import { cleanup, fireEvent, render } from '@/test-utils'

import { Button } from '../Button'

describe('<Button />', () => {
  beforeEach(() => {
    cleanup()
  })
  test('should handle click event', () => {
    const mockFn = jest.fn()
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

  test('should not handle click event when disabled', () => {
    const mockFn = jest.fn()
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
  test('should render with correct label', () => {
    const { getByTestId } = render(<Button variant='default'>click</Button>)
    const button = getByTestId('button')
    expect(button).toHaveTextContent('click')
  })
})
