import { ButtonHTMLAttributes } from 'react'

import { useGlobalState } from '@/providers/store/GlobalStateContext'

import { getButtonStyles } from './Button.helpers'

export type ButtonType = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonType
  onClick?: () => void
  label: string
}

export const Button = ({ variant, label }: ButtonProps) => {
  const { state } = useGlobalState()
  const buttonStyles = getButtonStyles(variant, state.theme.mode)
  return <button className={buttonStyles}>{label}</button>
}
