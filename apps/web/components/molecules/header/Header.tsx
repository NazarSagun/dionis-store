'use client'

import Image from 'next/image'
import Link from 'next/link'

import { ThemeIcon } from '@/components/atoms/theme-icon'
import { useTheme } from '@/providers/theme/ThemeProvider'

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
  const { toggleTheme, theme } = useTheme()

  const headerStyles = clsx(classes.header, theme === 'light' && classes.light)

  return (
    <header className={headerStyles}>
      <div>
        <span>Dionis</span>
        <Image
          width={40}
          height={40}
          alt='logo'
          src={`/icons/${theme}-logo.png`}
        />
      </div>
      <nav>
        <ThemeIcon
          theme={theme}
          onClick={toggleTheme}
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
