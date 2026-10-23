import * as Sentry from '@sentry/nextjs'

// Node.js and Edge runtimes, loaded from instrumentation.ts.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})
