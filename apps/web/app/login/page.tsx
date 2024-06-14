'use client'

import { AuthPage } from '@/components/organisms'
import { useThemeState } from '@/providers/theme'

import clsx from 'clsx'
import classes from './page.module.css'

import { useLogin } from '@repo/dionis-api/src/dionis/default/default'
import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { useEffect } from 'react'

const LoginPage = () => {
  const { state } = useThemeState()
  const { state: global } = useGlobalState()
  const containerStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)

  const { mutate, error, isPending } = useLogin()

  if (error) {
    console.log(error.response?.data.message)
  }

  useEffect(() => {
    console.log(global)
  }, [global])
  return (
    <div className={containerStyles}>
      <AuthPage
        variant='login'
        isFormLoading={false}
        onSubmitForm={(formData) => {
          mutate({ data: { email: formData.email, password: formData.password } })
        }}
      />
    </div>
  )
}

export default LoginPage
