'use client'

import Image from 'next/image'
import Link from 'next/link'
import axios from 'axios'

import { ThemeIcon } from '@/components/atoms/theme-icon'
import { useTheme } from '@/providers/theme/ThemeProvider'

import clsx from 'clsx'
import classes from './Header.module.scss'

const instance = axios.create({
  baseURL: 'http://localhost:3500',
})

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

  const handleSignIn = async () => {
    try {
      // Make a request to the backend endpoint for Google authentication
      const response = await instance.get('/auth/google')

      console.log(response, 'RESPONSE')
    } catch (error) {
      console.error('Error signing in with Google:', error)
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
