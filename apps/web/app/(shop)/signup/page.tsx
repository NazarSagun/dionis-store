'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRegister } from '@repo/dionis-api/src/dionis/default/default'
import { useToast } from '@repo/ui'

import { AuthPage, FormVariant, useAuthStore } from '@/features/auth'

const SignUpPage = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)
  const router = useRouter()
  const { toast } = useToast()

  const { mutate, isPending } = useRegister({
    mutation: {
      onSuccess: (data) => {
        login(data.user?.accessToken as string, data.user?.name as string)
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
    if (isAuthenticated) {
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
