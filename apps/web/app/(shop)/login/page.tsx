'use client'

import { AuthPage, FormVariant, useToast } from '@/ui'

import { useLogin } from '@repo/dionis-api/src/dionis/default/default'
import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { AuthActionType } from '@/providers/store/actions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const LoginPage = () => {
  const { state: globalState, dispatch } = useGlobalState()
  const router = useRouter()
  const { toast } = useToast()

  const { mutate, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        dispatch({
          type: AuthActionType.AUTHENTICATE,
          payload: { token: data.user?.accessToken as string, name: data.user?.name as string },
        })
        router.push('/')
      },
      onError: (error) => {
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
    <div className='min-h-[75vh]'>
      <AuthPage
        variant={FormVariant.LOGIN}
        isFormLoading={isPending}
        onSubmitForm={(formData) => {
          mutate({ data: { email: formData.email, password: formData.password } })
        }}
      />
    </div>
  )
}

export default LoginPage
