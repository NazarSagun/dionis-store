'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Button, Input, Label } from '@repo/ui'

import { NewPasswordErrors, newPasswordErrors } from '../../domain/password'
import { AuthCard, authLinkStyles } from '../auth-card/AuthCard'

interface ResetPasswordFormProps {
  onSubmit: (password: string) => void
  isLoading: boolean
  // Set when the link has no token or the API rejected it.
  invalidLinkMessage?: string
}

export const ResetPasswordForm = ({ onSubmit, isLoading, invalidLinkMessage }: ResetPasswordFormProps) => {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<NewPasswordErrors>({})

  if (invalidLinkMessage) {
    return (
      <AuthCard
        testId='reset-error'
        eyebrow={<span className='text-destructive'>Link not valid</span>}
        title={invalidLinkMessage}
        description='A link works once and expires after 1 hour. Ask for a new one.'
      >
        <Link href='/forgot-password'>
          <Button className='w-full' variant='default'>
            Get a new link
          </Button>
        </Link>
        <Link href='/login' className={authLinkStyles}>
          Back to login
        </Link>
      </AuthCard>
    )
  }

  const submitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const found = newPasswordErrors(password, confirm)
    setErrors(found)
    if (Object.keys(found).length === 0) onSubmit(password)
  }

  return (
    <AuthCard
      eyebrow={<span className='text-muted-foreground'>Account recovery</span>}
      title='Set a new password'
      description='Use 8 to 72 characters. After you save, every device signs out.'
    >
      <form onSubmit={submitHandler} noValidate className='flex flex-col'>
        <Label htmlFor='new-password'>New password</Label>
        <Input
          onInputChange={setPassword}
          value={password}
          type='password'
          name='new-password'
          autoComplete='new-password'
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'new-password-error' : undefined}
          className={errors.password ? 'mb-1 border-destructive' : undefined}
          data-testid='reset-password'
        />
        {errors.password && (
          <p id='new-password-error' className='mb-5 font-sans text-[13px] text-destructive'>
            {errors.password}
          </p>
        )}
        <Label htmlFor='confirm-password'>Confirm password</Label>
        <Input
          onInputChange={setConfirm}
          value={confirm}
          type='password'
          name='confirm-password'
          autoComplete='new-password'
          aria-invalid={!!errors.confirm}
          aria-describedby={errors.confirm ? 'confirm-password-error' : undefined}
          className={errors.confirm ? 'mb-1 border-destructive' : undefined}
          data-testid='reset-confirm'
        />
        {errors.confirm && (
          <p id='confirm-password-error' className='mb-5 font-sans text-[13px] text-destructive'>
            {errors.confirm}
          </p>
        )}
        <Button data-testid='reset-submit' variant='default' disabled={isLoading}>
          Save password
        </Button>
      </form>
    </AuthCard>
  )
}
