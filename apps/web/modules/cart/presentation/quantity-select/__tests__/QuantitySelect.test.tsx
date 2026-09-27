import { describe, expect, test } from 'vitest'

import { fireEvent, render } from '@/test-utils/utils'

import { QuantitySelect } from '../QuantitySelect'

describe('<QuantitySelect />', () => {
  test('Should open options after click', () => {
    const { getByTestId, getAllByTestId } = render(<QuantitySelect onChange={() => {}} selectedOption={1} />)

    const select = getByTestId('select')
    fireEvent.click(select)

    expect(getAllByTestId('quantity-option')[0]).toBeInTheDocument()
  })

  test('Should display selected option and close option', () => {
    const { getByTestId, getAllByTestId, getByText } = render(<QuantitySelect onChange={() => {}} selectedOption={1} />)

    const select = getByTestId('select')
    fireEvent.click(select)

    const option = getAllByTestId('quantity-option')[1]

    fireEvent.click(option)

    expect(getByText('2')).toBeInTheDocument()
    expect(option).not.toBeInTheDocument()
  })
})
