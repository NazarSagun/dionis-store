import { useThemeState } from '@/providers/theme/ThemeContext'

import { LoginSvg } from '../LoginSvg'
import { SignUpSvg } from '../SignUpSvg'

import clsx from 'clsx'
import classes from './LeftContentBlock.module.scss'

interface LeftContentBlockProps {
  variant: 'login' | 'signup'
}

export const LeftContentBlock = ({ variant }: LeftContentBlockProps) => {
  const { state } = useThemeState()
  const containerStyles = clsx(classes.container, state.mode === 'light' && classes.light)

  return (
    <div className={containerStyles}>
      <h3>{variant === 'login' ? 'Welcome back!🚀' : 'Welcome to Dionis community!🌍'}</h3>
      {variant === 'login' ? <LoginSvg /> : <SignUpSvg />}
    </div>
  )
}
