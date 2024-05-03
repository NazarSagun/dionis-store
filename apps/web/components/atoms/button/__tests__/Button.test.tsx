import { cleanup, fireEvent, render } from '@/test-utils'

import { Button, ButtonType } from '../Button'

describe('<Button />', () => {
  beforeEach(() => {
    cleanup()
  })
  test('should handle click event', () => {
    const mockFn = jest.fn()
    const { getByTestId } = render(
      <Button
        variant={ButtonType.PRIMARY}
        label='click'
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
        variant={ButtonType.PRIMARY}
        label='click'
        onClick={mockFn}
        disabled
      />
    )

    const button = getByTestId('button')

    fireEvent.click(button)

    expect(mockFn).not.toHaveBeenCalled()
  })
  test('should render with correct label', () => {
    const { getByTestId } = render(
      <Button
        variant={ButtonType.PRIMARY}
        label='click'
      />
    )
    const button = getByTestId('button')
    expect(button).toHaveTextContent('click')
  })
  test.each([ButtonType.PRIMARY, ButtonType.SECONDARY])('should render correct variant', (variant) => {
    const { asFragment } = render(
      <Button
        variant={variant}
        label='click'
      />
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
