'use client'

import { AuthPage } from '@/components'
import { useThemeState } from '@/providers/theme'

const LoginPage = () => {
  const { state } = useThemeState()

  return (
    <AuthPage
      variant='login'
      onSubmitForm={(formData) => console.log(formData)}
    />
  )
}

export default LoginPage
