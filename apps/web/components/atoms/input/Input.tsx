import { ChangeEvent, InputHTMLAttributes, useState } from 'react'

import { useThemeState } from '@/providers/theme/ThemeContext'

import clsx from 'clsx'
import classes from './Input.module.scss'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  onInputChange?: (e: string) => void
  label: string
  errorMessage: string
}

export const Input = ({ type, name, onInputChange, label, errorMessage, disabled, ...props }: InputProps) => {
  const [value, setValue] = useState('')
  const { state } = useThemeState()

  const inputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value
    onInputChange && onInputChange(value)
    setValue(value)
  }

  const inputStyles = clsx(
    classes.inputContainer,
    state.mode === 'light' && classes.light,
    errorMessage && classes.error
  )

  return (
    <div className={inputStyles}>
      <label htmlFor={name}>{label}</label>
      <input
        onChange={inputChangeHandler}
        id={name}
        type={type}
        name={name}
        value={value}
        data-testid='input'
        disabled={disabled}
        {...props}
      />
      {errorMessage && <span>{errorMessage}</span>}
    </div>
  )
}
