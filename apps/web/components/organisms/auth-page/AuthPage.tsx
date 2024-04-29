import { AuthForm, UserData } from '../auth-form'

import { LeftContentBlock } from './components'

import classes from './AuthPage.module.scss'

interface AuthPageProps {
  variant: 'login' | 'signup'
  onSubmitForm: (userData: UserData) => void
}

export const AuthPage = ({ variant, onSubmitForm }: AuthPageProps) => {
  const authTitle = variant === 'login' ? 'Login to' : 'Create'
  const authPrivacyText = variant === 'login' ? 'logging into' : 'creating'
  return (
    <section className={classes.container}>
      <LeftContentBlock variant={variant} />
      <AuthForm
        onSubmitForm={onSubmitForm}
        title={`${authTitle} your Dionis account`}
        privacyText={`By ${authPrivacyText} an account, you agree to our terms and privacy policy.`}
        variant={variant}
      />
    </section>
  )
}
