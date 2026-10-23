// Loads apps/api/.env before Sentry reads SENTRY_DSN. ConfigModule loads it
// too, but only after Sentry.init has already run. It does not override a
// variable that the environment already sets.
import 'dotenv/config'
import * as Sentry from '@sentry/nestjs'

// Loaded before anything else in main.ts, so Sentry can patch http, express, and
// Prisma before they load. With SENTRY_DSN empty the SDK sends nothing.
// dataCollection stays unset on purpose: its permissive defaults would send
// request bodies, and the auth routes carry passwords.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [Sentry.prismaIntegration()],
})
