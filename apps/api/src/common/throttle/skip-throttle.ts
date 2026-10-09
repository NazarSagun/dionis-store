import { ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

// "::ffff:1.2.3.4" is the IPv4 address 1.2.3.4 as an IPv6 socket reports it.
const normalize = (ip: string) => ip.trim().replace(/^::ffff:/i, '')

// True when a request is exempt from the rate limit: RATE_LIMIT=off exempts
// everyone, and RATE_LIMIT_SKIP_IPS (a comma-separated list) exempts those client
// IPs. `request.ip` follows TRUST_PROXY, so behind Caddy it is the address that
// Caddy saw, and a client cannot choose it with its own X-Forwarded-For header.
export function shouldSkipThrottle(context: ExecutionContext, env: Record<string, string | undefined> = process.env) {
  if (env.RATE_LIMIT === 'off') return true

  const ip = context.switchToHttp().getRequest<Request>().ip
  if (!ip) return false

  return (env.RATE_LIMIT_SKIP_IPS ?? '').split(',').map(normalize).filter(Boolean).includes(normalize(ip))
}
