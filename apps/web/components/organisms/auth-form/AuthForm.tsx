'use client'

import { FormEvent, useState } from 'react'

import { Input, Button } from '@/components/atoms'
import { useThemeState } from '@/providers/theme'

import { validateInput } from './AuthForm.helpers'

import clsx from 'clsx'
import classes from './AuthForm.module.css'
import { Label } from '@/components/atoms/label/Label'

export type UserData = {
  email: string
  password: string
}

interface AuthFormProps {
  onSubmitForm: (userData: UserData) => void
  isLoading: boolean
  title: string
  privacyText: string
  variant: 'login' | 'signup'
}

export const AuthForm = ({ onSubmitForm, title, privacyText, variant, isLoading }: AuthFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailErrorMessage, setEmailErrorMessage] = useState('')
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('')

  const { state } = useThemeState()
  const formStyles = clsx(classes.form, state.mode === 'light' && classes.light)

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

    setEmail('')
    setPassword('')
    onSubmitForm({ email, password })
  }

  return (
    <form
      onSubmit={submitHandler}
      className={formStyles}
    >
      {title && <h3>{title}</h3>}
      <Label>Email</Label>
      <Input
        onInputChange={(e) => {
          setEmail(e)
          setEmailErrorMessage('')
        }}
        value={email}
        type='email'
        name='email'
      />
      <Label>Password</Label>
      <Input
        onInputChange={(e) => {
          setPassword(e)
          setPasswordErrorMessage('')
        }}
        value={password}
        type='password'
        name='password'
      />
      <Button
        variant='default'
        disabled={isLoading}
      >
        {variant === 'login' ? 'Login' : 'Register'}
      </Button>

      {privacyText && <p>{privacyText}</p>}
    </form>
  )
}
