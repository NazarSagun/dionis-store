'use client'

import { FormEvent, useState } from 'react'

import { Input, Button, Label } from '@/ui'
import { useThemeState } from '@/providers/theme'

import clsx from 'clsx'
import classes from './AuthForm.module.css'

export type UserData = {
  email: string
  password: string
  name?: string
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
  const [name, setName] = useState('')

  const { state } = useThemeState()
  const formStyles = clsx(classes.form, state.mode === 'light' && classes.light)

  const submitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setName('')
    setPassword('')
    variant === 'signup' ? onSubmitForm({ email, password, name }) : onSubmitForm({ email, password })
  }

  return (
    <form
      onSubmit={submitHandler}
      className={formStyles}
    >
      {title && <h3>{title}</h3>}
      {variant === 'signup' ? (
        <>
          <Label>Name</Label>
          <Input
            onInputChange={(e) => {
              setName(e)
            }}
            value={name}
            type='string'
            name='name'
          />
        </>
      ) : null}
      <Label>Email</Label>
      <Input
        onInputChange={(e) => {
          setEmail(e)
        }}
        value={email}
        type='email'
        name='email'
      />
      <Label>Password</Label>
      <Input
        onInputChange={(e) => {
          setPassword(e)
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
