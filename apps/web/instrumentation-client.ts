import * as Sentry from '@sentry/nextjs'

// Browser runtime. With NEXT_PUBLIC_SENTRY_DSN empty the SDK sends nothing.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // Sends the trace headers to the API too, so one trace covers the page and the API call.
  tracePropagationTargets: process.env.NEXT_PUBLIC_BASE_URL ? [process.env.NEXT_PUBLIC_BASE_URL] : [],
  // Records 10% of sessions, and every session that hits an error.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
