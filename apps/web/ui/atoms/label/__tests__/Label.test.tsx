import { render } from '@/test-utils/utils'
import { Label } from '../Label'
import { it, expect } from 'vitest'

it('Should render label with the coorect text', () => {
  const { getByText } = render(<Label>Label</Label>)

  expect(getByText('Label')).toBeInTheDocument()
})