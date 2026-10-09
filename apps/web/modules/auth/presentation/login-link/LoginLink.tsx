'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@repo/ui'

import { loginHref } from '../../domain/redirect'

// A "Log in" button that brings the user back to the current page.
export const LoginLink = () => {
  const pathname = usePathname()

  return (
    <Button asChild variant='secondary'>
      <Link href={loginHref(pathname)}>Log in</Link>
    </Button>
  )
}
