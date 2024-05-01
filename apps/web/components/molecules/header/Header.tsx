'use client'

import Image from 'next/image'
import Link from 'next/link'

import { ThemeIcon } from '@/components/atoms/theme-icon'
import { ThemeActionType } from '@/providers/store/actions'
import { useGlobalState } from '@/providers/store/GlobalStateContext'

import clsx from 'clsx'
import classes from './Header.module.scss'

const navigation = [
  {
    id: 1,
    label: 'Main',
    link: '/',
  },
  {
    id: 2,
    label: 'Login',
    link: '/login',
  },
  {
    id: 3,
    label: 'Sign Up',
    link: '/signup',
  },
]

export const Navigation = () => {
  const { state, dispatch } = useGlobalState()
  const mode = state.theme.mode

  const headerStyles = clsx(classes.header, mode === 'light' && classes.light)

  return (
    <header className={headerStyles}>
      <div>
        <span>Dionis</span>
        <Image
          width={40}
          height={40}
          alt='logo'
          src={`/icons/${mode}-logo.png`}
        />
      </div>
      <nav>
        <ThemeIcon
          theme={mode}
          onClick={() => dispatch({ type: ThemeActionType.TOGGLE_THEME })}
        />
        <ul>
          {navigation.map((item) => (
            <Link
              href={item.link}
              key={item.id}
            >
              <li>{item.label}</li>
            </Link>
          ))}
        </ul>
      </nav>
    </header>
  )
}
