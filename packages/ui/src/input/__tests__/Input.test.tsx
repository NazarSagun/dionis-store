import { cleanup, fireEvent, render } from '@testing-library/react'
import { Input } from '../Input'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'

describe('<Input />', () => {
  beforeEach(() => {
    cleanup()
  })
  it('should input the text', () => {
    const { getByTestId } = render(
      <Input onInputChange={() => {}} />
    )
    const element = getByTestId('input') as HTMLInputElement
    fireEvent.change(element, { target: { value: 'test' } })
    expect(element.value).toBe('test')
  })

  it('should not input the text if disabled', async () => {
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
