'use client'

import Image from 'next/image'
import Link from 'next/link'

import { useThemeState } from '@/providers/theme/ThemeContext'

import clsx from 'clsx'
import classes from './Header.module.css'
import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { AuthActionType } from '@/providers/store/actions'
import { useLogout } from '@repo/dionis-api/src/dionis/default/default'
import { DropdownAppearence } from '@/ui/molecules/dropdown/DropdownAppearence'

const navigation = [
  {
    id: 1,
    label: 'Login',
    link: '/login',
  },
  {
    id: 2,
    label: 'Sign Up',
    link: '/signup',
  },
]

export const Navigation = () => {
  const { state: authState, dispatch: authDispatch } = useGlobalState()
  const isUserAuth = authState.auth.isAuthenticated

  const { state } = useThemeState()

  const { refetch: logout } = useLogout({ query: { enabled: false } })

  const headerStyles = clsx(classes.header, state.mode === 'light' ? classes.light : null)
  const cartWrapperStyles = clsx(classes.cartWrapper)

  return (
    <header className={headerStyles}>
      <div>
        <span>Dionis</span>
        <Image
          priority={true}
          width={40}
          height={40}
          alt='logo'
          src={`/icons/logo.png`}
        />
      </div>
      <nav>
        <DropdownAppearence />
        <ul>
          <Link href={'/'}>
            <li>Home</li>
          </Link>
          {!isUserAuth ? (
            navigation.map((item) => (
              <Link
                href={item.link}
                key={item.id}
              >
                <li>{item.label}</li>
              </Link>
            ))
          ) : (
            <Link
              href={'/'}
              onClick={() => {
                logout()
                authDispatch({ type: AuthActionType.LOGOUT })
              }}
            >
              <li>Logout</li>
            </Link>
          )}
        </ul>
      </nav>
      <div className={cartWrapperStyles}>
        <Link href='/cart'>
          <Image
            priority={true}
            width={25}
            height={25}
            alt='logo'
            src={`/icons/shopping-cart.svg`}
          />
        </Link>
        <Link href='/account'>
          <Image
            priority={true}
            width={25}
            height={25}
            alt='logo'
            src={`/icons/account.svg`}
          />
        </Link>
      </div>
    </header>
  )
}
