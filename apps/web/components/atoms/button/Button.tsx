import { ButtonHTMLAttributes } from 'react'

import { useThemeState } from '@/providers/theme'

import { getButtonStyles } from './Button.helpers'

export type ButtonType = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonType
  onClick?: () => void
  label: string
}

export const Button = ({ variant, label }: ButtonProps) => {
  const { state } = useThemeState()
  const buttonStyles = getButtonStyles(variant, state.mode)
  return <button className={buttonStyles}>{label}</button>
}
