import { ButtonHTMLAttributes } from 'react'

import { useTheme } from '@/providers/theme/ThemeProvider'

import { getButtonStyles } from './Button.helpers'

export type ButtonType = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonType
  onClick?: () => void
  label: string
}

export const Button = ({ variant, label }: ButtonProps) => {
  const { theme } = useTheme()
  const buttonStyles = getButtonStyles(variant, theme)
  return <button className={buttonStyles}>{label}</button>
}
