'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLogin } from '@repo/dionis-api/src/dionis/default/default'
import { useToast } from '@repo/ui'

import { useAuthLogin, useIsAuthenticated } from '@/modules/auth/core/facade'
import { FormVariant } from '@/modules/auth/presentation/auth-form/AuthForm'
import { AuthPage } from '@/modules/auth/presentation/auth-page/AuthPage'

const LoginPage = () => {
  const isAuthenticated = useIsAuthenticated()
  const login = useAuthLogin()
  const router = useRouter()
  const { toast } = useToast()

  const { mutate, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.user?.accessToken as string, data.user?.name as string)
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
    if (isAuthenticated) {
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
