import { useThemeState } from '@/providers/theme/ThemeContext'

import Image from 'next/image'

import clsx from 'clsx'
import classes from './LeftContentBlock.module.css'

interface LeftContentBlockProps {
  variant: 'login' | 'signup'
}

export const LeftContentBlock = ({ variant }: LeftContentBlockProps) => {
  const { state } = useThemeState()
  const containerStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)

  return (
    <div className={containerStyles}>
      <h3>{variant === 'login' ? 'Welcome back!🚀' : 'Welcome to Dionis community!🌍'}</h3>
      {variant === 'login' ? (
        <Image
          alt='Login'
          src='/images/svg/login.svg'
          width={500}
          height={500}
        />
      ) : (
        <Image
          alt='Login'
          src='/images/svg/signup.svg'
          width={500}
          height={500}
        />
      )}
    </div>
  )
}
