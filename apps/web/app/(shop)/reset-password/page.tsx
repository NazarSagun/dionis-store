'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@repo/ui'

import { useResetPassword } from '@/modules/auth/integration/repository'
import { ResetPasswordForm } from '@/modules/auth/presentation/reset-password-form/ResetPasswordForm'

const INVALID_LINK = 'This reset link is invalid or expired'

const ResetPasswordPage = () => {
  const router = useRouter()
  const token = useSearchParams().get('token')
  const { toast } = useToast()

  const { mutate, isPending, error } = useResetPassword({
    mutation: {
      onSuccess: () => router.push('/login?passwordReset=1'),
      onError: (error) => {
        // A 400 means a bad link. Anything else, such as 429, keeps the form.
        if (error.response?.status !== 400) {
          toast({ variant: 'destructive', title: error.response?.data?.message ?? 'Something went wrong. Try again.' })
        }
      },
    },
  })

  const rejected = error?.response?.status === 400
  const invalidLinkMessage = token && !rejected ? undefined : (error?.response?.data?.message ?? INVALID_LINK)

  return (
    <ResetPasswordForm
      isLoading={isPending}
      invalidLinkMessage={invalidLinkMessage}
      onSubmit={(password) => token && mutate({ data: { token, password } })}
    />
  )
}

export default ResetPasswordPage
