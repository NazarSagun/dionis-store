import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { useAuthStore } from '@/modules/auth/core/store'
import { render } from '@/test-utils/utils'

import { MainNavigation } from '../MainNavigation'

describe('<MainNavigation />', () => {
  it('Should render component', () => {
    const { container } = render(<MainNavigation />)

    expect(container).toBeInTheDocument()
  })

  it('Should render links correctly', () => {
    const { getByText } = render(<MainNavigation />)

    expect(getByText('DIONIS')).toBeInTheDocument()
    expect(getByText('Cart (0)')).toBeInTheDocument()
  })

  it('Should show Login and Sign Up in the account menu when signed out', async () => {
    const user = userEvent.setup()
    const { getByTestId, findByText } = render(<MainNavigation />)

    await user.click(getByTestId('account-menu-trigger'))

    expect(await findByText('Login')).toBeInTheDocument()
    expect(await findByText('Sign Up')).toBeInTheDocument()
  })

  it('Should show a Wishlist link in the account menu when signed in', async () => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: 'token', user: { name: 'Player' } })
    const user = userEvent.setup()
    const { getByTestId, findByText } = render(<MainNavigation />)

    await user.click(getByTestId('account-menu-trigger'))

    expect(await findByText('Wishlist')).toBeInTheDocument()
  })
})
