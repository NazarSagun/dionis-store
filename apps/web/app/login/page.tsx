'use client'

import { AuthPage } from '@/components/organisms'
import { useThemeState } from '@/providers/theme'

import clsx from 'clsx'
import classes from './page.module.css'

import { useLogin } from '@repo/dionis-api/src/dionis/default/default'
import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { AuthActionType } from '@/providers/store/actions'

const LoginPage = () => {
  const { state } = useThemeState()
  const { state: global, dispatch } = useGlobalState()
  const containerStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)

  const { mutate, error, isPending, data, isSuccess } = useLogin({
    mutation: {
      onSuccess: (data) => {
        dispatch({ type: AuthActionType.AUTHENTICATE, payload: data.accessToken as string })
      },
      onError: (error) => {
        console.error('Error:', error)
      },
    },
  })

  return (
    <div className={containerStyles}>
      <AuthPage
        variant='login'
        isFormLoading={isPending}
        onSubmitForm={(formData) => {
          mutate({ data: { email: formData.email, password: formData.password } })
        }}
      />
    </div>
  )
}

export default LoginPage
