import { fireEvent, render } from '@/test-utils/utils'
import { MainNavigation } from '../MainNavigation'
import { expect, describe, it, vi } from 'vitest'

describe('<MainNavigation />', () => {
  it('Should render component', () => {
    const { container } = render(<MainNavigation />)

    expect(container).toBeInTheDocument()
  })

  it('Should render links correctly', () => {
    const { getByText } = render(<MainNavigation />)

    expect(getByText('Login')).toBeInTheDocument()
    expect(getByText('Home')).toBeInTheDocument()
    expect(getByText('Sign Up')).toBeInTheDocument()
    expect(getByText('Dionis')).toBeInTheDocument()
  })
})
