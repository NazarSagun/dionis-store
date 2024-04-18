import { FormEvent, useState } from 'react'

import { Button } from '@/components/atoms'
import { Input } from '@/components/atoms'
import { useTheme } from '@/providers/theme/ThemeProvider'

import { validateInput } from './AuthForm.helpers'

import clsx from 'clsx'
import classes from './AuthForm.module.scss'

type UserData = {
  email: string
  password: string
}

interface AuthFormProps {
  onSubmitForm: (userData: UserData) => void
  title: string
  privacyText: string
}

export const AuthForm = ({ onSubmitForm, title, privacyText }: AuthFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailErrorMessage, setEmailErrorMessage] = useState('')
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('')

  const { theme } = useTheme()
  const formStyles = clsx(classes.form, theme === 'light' && classes.light)

  const submitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const isEmailValid = validateInput('email', email)
    const isPasswordValid = validateInput('password', password)

    if (!isEmailValid) {
      setEmailErrorMessage('Invalid email')
    }
    if (!isPasswordValid) {
      setPasswordErrorMessage('Invalid password')
      return
    }

    onSubmitForm({ email, password })
    setEmail('')
    setPassword('')
  }

  return (
    <form
      onSubmit={submitHandler}
      className={formStyles}
    >
      {title && <h3>{title}</h3>}
      <Input
        onInputChange={(e) => {
          setEmail(e)
          setEmailErrorMessage('')
        }}
        type='email'
        name='email'
        label='Email'
        errorMessage={emailErrorMessage}
      />
      <Input
        onInputChange={(e) => {
          setPassword(e)
          setPasswordErrorMessage('')
        }}
        type='password'
        name='password'
        label='Password'
        errorMessage={passwordErrorMessage}
      />
      <Button
        variant='primary'
        label='Login'
      />

      {privacyText && <p>{privacyText}</p>}
    </form>
  )
}
