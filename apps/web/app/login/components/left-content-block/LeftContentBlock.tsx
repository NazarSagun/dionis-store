import { useTheme } from '@/providers/theme/ThemeProvider'

import { LoginSvg } from '../LoginSvg'

import clsx from 'clsx'
import classes from './LeftContentBlock.module.scss'

export const LeftContentBlock = () => {
  const { theme } = useTheme()
  const containerStyles = clsx(classes.container, theme === 'light' && classes.light)

  return (
    <div className={containerStyles}>
      <h3>Welcome back!🚀</h3>
      <LoginSvg />
    </div>
  )
}
