'use client'

import { AuthPage } from '@/components'

const SignUpPage = () => {
  return (
    <AuthPage
      variant='signup'
      onSubmitForm={(formData) => console.log(formData)}
    />
  )
}

export default SignUpPage
