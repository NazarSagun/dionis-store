import { fireEvent, render } from '@/test-utils/utils'
import { test, expect, describe } from 'vitest'
import { QuantitySelect } from '../QuantitySelect'

describe('<QuantitySelect />', () => {
  test('Should open options after click', () => {
    const { getByTestId } = render(<QuantitySelect onChange={() => {}} selectedOption={1} />)

    const select = getByTestId('select')
    fireEvent.click(select)

    expect(getByTestId('option-1')).toBeInTheDocument()
  })

  test('Should display selected option and close option', () => {
    const { getByTestId, getByText } = render(<QuantitySelect onChange={() => {}} selectedOption={1} />)

    const select = getByTestId('select')
    fireEvent.click(select)

    const option = getByTestId('option-2')

    fireEvent.click(option)

    expect(getByText('2')).toBeInTheDocument()
    expect(option).not.toBeInTheDocument()
  })
})
