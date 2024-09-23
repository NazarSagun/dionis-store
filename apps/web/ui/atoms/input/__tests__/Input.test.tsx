import { fireEvent, render } from '@/test-utils'
import { Input } from '../Input'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

const renderInputCompoent = () => {
  const [value, setValue] = useState()

  return 
}

describe('<Input />', () => {
  test('should display the label correctly', () => {
    const { getByText } = render(
      <Input onInputChange={() => {}} />
    )
    expect(getByText('text')).toBeInTheDocument()
  })

  test('should input the text', () => {
    const { getByTestId } = render(
      <Input onInputChange={() => {}} />
    )
    const element = getByTestId('input') as HTMLInputElement
    fireEvent.change(element, { target: { value: 'test' } })
    expect(element.value).toBe('test')
  })

  test('should not input the text if disabled', async () => {
    const user = userEvent.setup()

    const { getByTestId } = render(
      <Input onInputChange={() => {}} disabled />
    )
    const element = getByTestId('input') as HTMLInputElement
    expect(element.value).toBe('')
    expect(element).toBeDisabled()

    await user.type(element, 'text')

    expect(element.value).toBe('')
  })
})
