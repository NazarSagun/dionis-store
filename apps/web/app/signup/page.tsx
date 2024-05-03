'use client'

import { AuthPage } from '@/components'
import { useThemeState } from '@/providers/theme'

import clsx from 'clsx'
import classes from './page.module.scss'

const SignUpPage = () => {
  const { state } = useThemeState()
  const containerStyles = clsx(classes.container, state.mode === 'light' ? classes.light : null)
  return (
    <div className={containerStyles}>
      <AuthPage
        variant='signup'
        onSubmitForm={(formData) => console.log(formData)}
      />
    </div>
  )
}

export default SignUpPage
