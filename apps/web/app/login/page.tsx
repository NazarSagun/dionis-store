'use client'

import { AuthForm } from '@/components/organisms/auth-form'

import { LeftContentBlock } from './components'

import classes from './page.module.scss'

const LoginPage = () => {
  return (
    <section className={classes.container}>
      <LeftContentBlock />
      <AuthForm
        onSubmitForm={(userData) => console.log(userData)}
        title='Login to your Dionis account'
        privacyText='By logging into an account, you agree to our terms and privacy policy.'
      />
    </section>
  )
}

export default LoginPage
