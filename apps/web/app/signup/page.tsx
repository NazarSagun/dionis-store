'use client'

import { AuthPage } from '@/components/organisms'
import { useThemeState } from '@/providers/theme'

import clsx from 'clsx'
import classes from './page.module.css'

import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/molecules/toast/use-toast'
import { useRegister } from '@repo/dionis-api/src/dionis/default/default'
import { AuthActionType } from '@/providers/store/actions'

const SignUpPage = () => {
  const { state } = useThemeState()
  const { dispatch } = useGlobalState()
  const router = useRouter()
  const { toast } = useToast()
  const containerStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)

  const { mutate, isPending } = useRegister({
    mutation: {
      onSuccess: (data) => {
        dispatch({ type: AuthActionType.AUTHENTICATE, payload: data.accessToken as string })
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
