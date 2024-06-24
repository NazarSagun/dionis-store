import { fireEvent, render } from '@/test-utils'
import { Input } from '../Input'
import userEvent from '@testing-library/user-event'

describe('<Input />', () => {
  test('should display the label correctly', () => {
    const { getByText } = render(
      <Input
        label='text'
        errorMessage=''
      />
    )
    expect(getByText('text')).toBeInTheDocument()
  })

  test('should input the text', () => {
    const { getByTestId } = render(
      <Input
        label='text'
        errorMessage=''
      />
    )
    const element = getByTestId('input') as HTMLInputElement
    fireEvent.change(element, { target: { value: 'test' } })
    expect(element.value).toBe('test')
  })

  test('should not input the text if disabled', async () => {
    const user = userEvent.setup()

    const { getByTestId } = render(
      <Input
        label='text'
        errorMessage=''
        disabled
      />
    )
    const element = getByTestId('input') as HTMLInputElement
    expect(element.value).toBe('')
    expect(element).toBeDisabled()

    await user.type(element, 'text')

    expect(element.value).toBe('')
  })

  test('should show an error message if provided', async () => {
    const { getByText } = render(
      <Input
        type='password'
        label='text'
        errorMessage='error'
      />
    )
    const label = getByText('error')

    expect(label).toBeInTheDocument()
  })
})
