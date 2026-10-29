'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Button, Input, Label } from '@repo/ui'

import { AuthCard, authLinkStyles } from '../auth-card/AuthCard'

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => void
  isLoading: boolean
  isSent: boolean
}

export const ForgotPasswordForm = ({ onSubmit, isLoading, isSent }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('')

  if (isSent) {
    return (
      <AuthCard
        testId='forgot-sent'
        eyebrow={<span className='text-success'>Link sent</span>}
        title='Check your inbox'
        description='If an account uses this address, a reset link is on its way. Check your inbox.'
      >
        <p className='font-sans text-sm text-muted-foreground'>The link works once and expires in 1 hour.</p>
        <Link href='/login' className={authLinkStyles}>
          Back to login
        </Link>
      </AuthCard>
    )
  }

  const submitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(email)
  }

  return (
    <AuthCard
      eyebrow={<span className='text-muted-foreground'>Account recovery</span>}
      title='Forgot your password?'
      description='Enter the email of your account. We will send you a link to set a new password.'
    >
      <form onSubmit={submitHandler} className='flex flex-col'>
        <Label htmlFor='email'>Email</Label>
        <Input
          onInputChange={setEmail}
          value={email}
          type='email'
          name='email'
          required
          autoComplete='email'
          placeholder='you@example.com'
          data-testid='forgot-email'
        />
        <Button data-testid='forgot-submit' variant='default' disabled={isLoading}>
          Send reset link
        </Button>
      </form>
      <Link href='/login' className={authLinkStyles}>
        Back to login
      </Link>
    </AuthCard>
  )
}
