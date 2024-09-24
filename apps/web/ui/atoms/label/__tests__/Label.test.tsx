import { render } from '@/test-utils'
import { Label } from '../Label'

it('Should render label with the coorect text', () => {
  const { getByText } = render(<Label>Label</Label>)

  expect(getByText('Label')).toBeInTheDocument()
})