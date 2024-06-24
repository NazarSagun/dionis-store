'use client'

import { AuthPage, useToast } from '@/ui'
import { useThemeState } from '@/providers/theme'

import clsx from 'clsx'
import classes from './page.module.css'

import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { useRouter } from 'next/navigation'
import { useRegister } from '@repo/dionis-api/src/dionis/default/default'
import { AuthActionType } from '@/providers/store/actions'
import { useEffect } from 'react'

const SignUpPage = () => {
  const { state } = useThemeState()
  const { state: globalState, dispatch } = useGlobalState()
  const router = useRouter()
  const { toast } = useToast()
  const containerStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)

  const { mutate, isPending } = useRegister({
    mutation: {
      onSuccess: (data) => {
        dispatch({ type: AuthActionType.AUTHENTICATE, payload: data.user?.accessToken as string })
        router.push('/')
      },
      onError: (error) => {
        console.error('Error:', error.response?.data.message)
        toast({
          variant: 'destructive',
          title: error.response?.data.message + ' Please try again.',
        })
      },
    },
  })

  useEffect(() => {
    if (globalState.auth.isAuthenticated) {
      router.push('/')
    }
  }, [])

  return (
    <div className={containerStyles}>
      <AuthPage
        isFormLoading={isPending}
        variant='signup'
        onSubmitForm={(formData) => {
          mutate({ data: { email: formData.email, password: formData.password, name: formData.name } })
        }}
      />
    </div>
  )
}

export default SignUpPage
