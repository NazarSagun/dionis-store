'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLogin } from '@repo/dionis-api/src/dionis/default/default'
import { useToast } from '@repo/ui'

import { useAuthLogin, useIsAuthenticated } from '@/modules/auth/core/facade'
import { loginHref, safeNextPath } from '@/modules/auth/domain/redirect'
import { FormVariant } from '@/modules/auth/presentation/auth-form/AuthForm'
import { AuthPage } from '@/modules/auth/presentation/auth-page/AuthPage'

const LoginPage = () => {
  const isAuthenticated = useIsAuthenticated()
  const login = useAuthLogin()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  // A page that sent the user here, such as a game, asks to get them back.
  const nextPath = safeNextPath(searchParams.get('next'))

  const { mutate, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.user?.accessToken as string, data.user?.name as string, data.user?.role)
        router.push(nextPath)
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
      router.push(nextPath)
    }
  }, [isAuthenticated, nextPath, router])

  useEffect(() => {
    if (searchParams.get('sessionExpired') === '1') {
      toast({
        variant: 'destructive',
        title: 'Your session has expired',
        description: 'Please log in again to continue.',
      })
      // Drop the flag, keep the return path.
      router.replace(loginHref(searchParams.get('next')))
    }
  }, [searchParams, router, toast])

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
