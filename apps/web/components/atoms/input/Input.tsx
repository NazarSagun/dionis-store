import { InputHTMLAttributes, useState, ChangeEvent } from 'react'

import { useTheme } from '@/providers/theme/ThemeProvider'

import { validateInput } from './Input.helpers'

import clsx from 'clsx'
import classes from './Input.module.scss'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  onInputChange?: (e: string) => void
  label: string
}

export const Input = ({ type, name, onInputChange, label, ...props }: InputProps) => {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { theme } = useTheme()

  const inputFocusHandler = () => {
    setError(false)
    setErrorMessage('')
  }

  const inputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value
    onInputChange && onInputChange(value)
    setValue(value)
  }

  const inputBlurHandler = () => {
    const isValid = validateInput(type, value)
    if (!isValid) {
      setError(true)
      setErrorMessage(`Invalid ${type}`)
    }
  }

  const inputStyles = clsx(classes.inputContainer, theme === 'light' && classes.light, error && classes.error)

  return (
    <div className={inputStyles}>
      <label htmlFor={name}>{label}</label>
      <input
        onChange={inputChangeHandler}
        id={name}
        type={type}
        name={name}
        value={value}
        onBlur={inputBlurHandler}
        onFocus={inputFocusHandler}
        {...props}
      />
      {error && errorMessage && <span>{errorMessage}</span>}
    </div>
  )
}
