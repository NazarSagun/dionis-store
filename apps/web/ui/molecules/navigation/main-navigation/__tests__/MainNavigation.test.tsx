import { render } from '@/test-utils/utils'
import { MainNavigation } from '@/ui'
import { expect, describe, it } from 'vitest'

describe('<MainNavigation />', () => {
  it('Should render component', () => {
    const { container } = render(<MainNavigation />)

    expect(container).toBeInTheDocument()
  })
})
