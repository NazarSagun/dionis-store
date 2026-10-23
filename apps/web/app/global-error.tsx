'use client'

import { useEffect } from 'react'
import NextError from 'next/error'
import * as Sentry from '@sentry/nextjs'

// Catches render errors in the root layout, which no other error boundary covers.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang='en'>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
