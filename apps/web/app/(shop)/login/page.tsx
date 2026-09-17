'use client'

import { useToast } from '@repo/ui'
import { AuthPage, FormVariant, useAuthStore } from '@/features/auth'

import { useLogin } from '@repo/dionis-api/src/dionis/default/default'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const LoginPage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)
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
