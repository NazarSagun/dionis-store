'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Button, Input, Label } from '@repo/ui'

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
    <form
      onSubmit={submitHandler}
      className='flex w-[350px] flex-col rounded-md border-2 border-ink bg-panel-alt px-5 py-[15px] shadow-retro'
    >
      <h3 className='mb-5 mt-2.5 font-display text-sm text-neon-magenta'>{authTitle} your Dionis account</h3>
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
        <p className='m-0 mt-[15px] text-start text-xs text-balance text-muted-foreground'>
          Don't have an account?{' '}
          <Button
            className='px-[5px] py-[5px] text-xs'
            onClick={() => setFormVariant(FormVariant.SIGNUP)}
            variant='link'
          >
            Register
          </Button>
        </p>
      )}

      <p className='mb-0 mt-[15px] text-balance text-center text-xs text-muted-foreground'>
        {authPrivacyText} an account, you agree to our terms and privacy policy.
      </p>
    </form>
  )
}
