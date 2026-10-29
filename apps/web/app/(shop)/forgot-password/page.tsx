'use client'

import { useToast } from '@repo/ui'

import { useForgotPassword } from '@/modules/auth/integration/repository'
import { ForgotPasswordForm } from '@/modules/auth/presentation/forgot-password-form/ForgotPasswordForm'

const ForgotPasswordPage = () => {
  const { toast } = useToast()
  const { mutate, isPending, isSuccess } = useForgotPassword({
    mutation: {
      onError: (error) => {
        toast({ variant: 'destructive', title: error.response?.data?.message ?? 'Something went wrong. Try again.' })
      },
    },
  })

  return (
    <ForgotPasswordForm isLoading={isPending} isSent={isSuccess} onSubmit={(email) => mutate({ data: { email } })} />
  )
}

export default ForgotPasswordPage
