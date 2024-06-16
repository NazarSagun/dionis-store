'use client'

import Image from 'next/image'
import Link from 'next/link'

import { ThemeIcon } from '@/components/atoms/theme-icon'
import { useThemeState } from '@/providers/theme/ThemeContext'

import clsx from 'clsx'
import classes from './Header.module.css'
import { Theme, ThemeActionType } from '@/providers/theme'
import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { AuthActionType } from '@/providers/store/actions'
import { useLogout } from '@repo/dionis-api/src/dionis/default/default'

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

  const { state, dispatch } = useThemeState()
  const { refetch: logout } = useLogout({ query: { enabled: false } })

  const mode = state.mode
  const headerStyles = clsx(classes.header, mode === 'light' ? classes.light : null)

  const changeBodyStyles = () => {
    const body = document.getElementById('body')
    if (mode === Theme.LIGHT && body) {
      body.classList.add('light')
    } else {
      body && body.classList.remove('light')
    }
  }

  return (
    <header className={headerStyles}>
      <div>
        <span>Dionis</span>
        <Image
          width={40}
          height={40}
          alt='logo'
          src={`/icons/logo.png`}
        />
      </div>
      <nav>
        <ThemeIcon
          onClick={() => {
            localStorage.setItem('theme', mode)
            changeBodyStyles()
            dispatch({ type: ThemeActionType.TOGGLE_THEME })
          }}
        />
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
    </header>
  )
}
