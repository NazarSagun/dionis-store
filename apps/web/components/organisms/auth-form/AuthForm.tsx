import { FormEvent, useState } from 'react'

import { Button } from '@/components/atoms'
import { Input } from '@/components/atoms'

import clsx from 'clsx'
import classes from './AuthForm.module.scss'

export const AuthForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const formStyles = clsx(classes.form)

  const submitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  return (
    <form
      onSubmit={submitHandler}
      className={formStyles}
    >
      <Input
        onInputChange={(e) => setEmail(e)}
        type='email'
        name='email'
        label='Email'
      />
      <Input
        onInputChange={(e) => setPassword(e)}
        type='password'
        name='password'
        label='Password'
      />
      <Button
        variant='primary'
        label='Login'
      />
    </form>
  )
}
