import { InputHTMLAttributes, useState } from 'react'
import clsx from 'clsx'

import { useTheme } from '@/providers/theme/ThemeProvider'

import { validateInput } from './Input.helpers'

import classes from './Input.module.scss'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  onChange?: (e: React.FormEvent<HTMLInputElement>) => void
}

export const Input = ({ type, name, onChange, ...props }: InputProps) => {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { theme } = useTheme()

  const inputFocusHandler = () => {
    setError(false)
    setErrorMessage('')
  }

  const inputChangeHandler = (e: React.FormEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value)
  }

  const inputBlurHandler = () => {
    const isValid = validateInput(type, value)
    if (!isValid) {
      setError(true)
      setErrorMessage(`Invalid ${type}`)
    }
  }

  const inputStyles = clsx(
    classes.inputContainer,
    theme === 'light' && classes.light,
    error && classes.error
  )

  return (
    <div className={inputStyles}>
      <label htmlFor={name}>{name}</label>
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
