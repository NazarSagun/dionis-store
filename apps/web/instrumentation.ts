import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.server.config')
  }
}

// Reports every unhandled error from a server component, route handler, or server action.
export const onRequestError = Sentry.captureRequestError
