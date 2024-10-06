'use client'

import { FormEvent, useEffect, useState } from 'react'

import { Input, Button, Label } from '@/ui'
import { useThemeState } from '@/providers/theme'

import clsx from 'clsx'
import classes from './AuthForm.module.css'

export type UserData = {
  email: string
  password: string
  name?: string
}

export enum FormVariant {
  LOGIN = 'login',
  SIGNUP = 'signup',
}

export interface AuthFormProps {
  onSubmitForm: (userData: UserData) => void
  isLoading: boolean
  variant: FormVariant
  onVariantChange?: (form: FormVariant) => void
}

export const AuthForm = ({ onSubmitForm, variant, isLoading, onVariantChange }: AuthFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [formVariant, setFormVariant] = useState(variant)

  const { state } = useThemeState()
  const formStyles = clsx(classes.form, state.mode === 'light' && classes.light)

  const submitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setName('')
    setPassword('')
    formVariant === FormVariant.SIGNUP ? onSubmitForm({ email, password, name }) : onSubmitForm({ email, password })
  }

  const authTitle = formVariant === 'login' ? 'Login into' : 'Create'
  const authPrivacyText = formVariant === 'login' ? 'Logging into' : 'Creating'

  useEffect(() => onVariantChange && onVariantChange(formVariant), [formVariant])

  return (
    <form onSubmit={submitHandler} className={formStyles}>
      <h3>{authTitle} your Dionis account</h3>
      {formVariant === FormVariant.SIGNUP ? (
        <>
          <Label>Name</Label>
          <Input
            onInputChange={(e) => {
              setName(e)
            }}
            value={name}
            type='string'
            name='name'
            data-testid='name'
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
        data-testid='email'
      />
      <Label>Password</Label>
      <Input
        onInputChange={(e) => {
          setPassword(e)
        }}
        value={password}
        type='password'
        name='password'
        data-testid='password'
      />
      <Button data-testid='submit-button' variant='default' disabled={isLoading}>
        {formVariant === FormVariant.LOGIN ? 'Login' : 'Register'}
      </Button>

      {formVariant === FormVariant.LOGIN && (
        <p className={classes.register}>
          Don't have an account?{' '}
          <Button onClick={() => setFormVariant(FormVariant.SIGNUP)} variant='link'>
            Register
          </Button>
        </p>
      )}

      <p>{authPrivacyText} an account, you agree to our terms and privacy policy.</p>
    </form>
  )
}
