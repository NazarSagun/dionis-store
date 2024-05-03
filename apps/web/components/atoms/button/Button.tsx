import { ButtonHTMLAttributes } from 'react'

import { useThemeState } from '@/providers/theme'

import { getButtonStyles } from './Button.helpers'

export enum ButtonType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonType.PRIMARY | ButtonType.SECONDARY
  onClick?: () => void
  label: string
}

export const Button = ({ variant, label, onClick, disabled = false }: ButtonProps) => {
  const { state } = useThemeState()
  const buttonStyles = getButtonStyles(variant, state.mode)
  return (
    <button
      data-testid='button'
      className={buttonStyles}
      onClick={onClick && onClick}
      disabled={disabled}
    >
      {label}
    </button>
  )
}
