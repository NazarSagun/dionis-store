'use client'

import { AuthPage, FormVariant, useToast } from '@/ui'

import { useGlobalState } from '@/providers/store/GlobalStateContext'
import { useRouter } from 'next/navigation'
import { useRegister } from '@repo/dionis-api/src/dionis/default/default'
import { AuthActionType } from '@/providers/store/actions'
import { useEffect } from 'react'

const SignUpPage = () => {
  const { state: globalState, dispatch } = useGlobalState()
  const router = useRouter()
  const { toast } = useToast()

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
    <div className='min-h-[75vh]'>
      <AuthPage
        isFormLoading={isPending}
        variant={FormVariant.SIGNUP}
        onSubmitForm={(formData) => {
          mutate({ data: { email: formData.email, password: formData.password, name: formData.name } })
        }}
      />
    </div>
  )
}

export default SignUpPage
