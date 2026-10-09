import { timingSafeEqual } from 'crypto'
import { ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

// Node lower-cases header names.
export const BYPASS_HEADER = 'x-load-test-token'
// A shorter secret is too easy to guess, so it is ignored.
export const BYPASS_TOKEN_MIN_LENGTH = 32

function sameSecret(given: string, expected: string) {
  const left = Buffer.from(given)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

// True when a request is exempt from the rate limit. RATE_LIMIT=off exempts
// everyone. A request that sends RATE_LIMIT_BYPASS_TOKEN in the X-Load-Test-Token
// header is exempt too, so a load test needs no IP list. The compare takes the
// same time for every wrong value of the same length.
export function shouldSkipThrottle(context: ExecutionContext, env: Record<string, string | undefined> = process.env) {
  if (env.RATE_LIMIT === 'off') return true

  const token = env.RATE_LIMIT_BYPASS_TOKEN
  if (!token || token.length < BYPASS_TOKEN_MIN_LENGTH) return false

  const given = context.switchToHttp().getRequest<Request>().headers[BYPASS_HEADER]
  return typeof given === 'string' && sameSecret(given, token)
}
