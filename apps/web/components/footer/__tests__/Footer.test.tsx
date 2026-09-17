import { expect, it } from 'vitest'

import { render } from '@/test-utils/utils'

import { Footer } from '../Footer'

it('Should render footer', () => {
  const { container } = render(<Footer />)

  expect(container).toBeInTheDocument()
})
