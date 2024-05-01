import { useGlobalState } from '@/providers/store/GlobalStateContext'

import { LoginSvg } from '../LoginSvg'
import { SignUpSvg } from '../SignUpSvg'

import clsx from 'clsx'
import classes from './LeftContentBlock.module.scss'

interface LeftContentBlockProps {
  variant: 'login' | 'signup'
}

export const LeftContentBlock = ({ variant }: LeftContentBlockProps) => {
  const { state } = useGlobalState()
  const containerStyles = clsx(classes.container, state.theme.mode === 'light' && classes.light)

  return (
    <div className={containerStyles}>
      <h3>{variant === 'login' ? 'Welcome back!🚀' : 'Welcome to Dionis community!🌍'}</h3>
      {variant === 'login' ? <LoginSvg /> : <SignUpSvg />}
    </div>
  )
}
