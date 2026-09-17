import { handlers } from '@repo/dionis-api/src/mock-handlers'
import { setupServer } from 'msw/node'

export const serviceWorker = setupServer(...handlers)
