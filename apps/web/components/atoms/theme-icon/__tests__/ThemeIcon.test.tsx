import { fireEvent, render } from '@/test-utils'
import { ThemeIcon } from '../ThemeIcon'

describe('<ThemeIcon />', () => {
  test('should handle a click event', () => {
    const mockFn = jest.fn()
    const { getByTestId } = render(<ThemeIcon onClick={mockFn} />)
    const element = getByTestId('theme-button')

    fireEvent.click(element)

    expect(mockFn).toHaveBeenCalled()
  })

  test('should render light mode icon initially', () => {
    const { getByTestId } = render(<ThemeIcon />)

    const element = getByTestId('theme-icon')
    expect(element).toHaveAttribute('alt', 'switch-to-dark-mode-icon')
  })
})
