import { ExecutionContext } from '@nestjs/common'
import { shouldSkipThrottle } from './skip-throttle'

const contextFor = (ip: string | undefined) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ ip }) }) }) as unknown as ExecutionContext

describe('shouldSkipThrottle', () => {
  it('limits every client when nothing is set', () => {
    expect(shouldSkipThrottle(contextFor('3.143.247.187'), {})).toBe(false)
  })

  it('exempts everyone when RATE_LIMIT is off', () => {
    expect(shouldSkipThrottle(contextFor('9.9.9.9'), { RATE_LIMIT: 'off' })).toBe(true)
  })

  it('exempts only the listed IPs', () => {
    const env = { RATE_LIMIT_SKIP_IPS: '3.143.247.187, 10.0.0.5' }

    expect(shouldSkipThrottle(contextFor('3.143.247.187'), env)).toBe(true)
    expect(shouldSkipThrottle(contextFor('10.0.0.5'), env)).toBe(true)
    expect(shouldSkipThrottle(contextFor('3.143.247.188'), env)).toBe(false)
    expect(shouldSkipThrottle(contextFor('13.143.247.187'), env)).toBe(false)
  })

  it('matches an IPv4 address that arrives in IPv6 form', () => {
    const env = { RATE_LIMIT_SKIP_IPS: '3.143.247.187' }

    expect(shouldSkipThrottle(contextFor('::ffff:3.143.247.187'), env)).toBe(true)
  })

  it('limits a request with no IP, and ignores an empty list or empty entries', () => {
    expect(shouldSkipThrottle(contextFor(undefined), { RATE_LIMIT_SKIP_IPS: '3.143.247.187' })).toBe(false)
    expect(shouldSkipThrottle(contextFor(''), { RATE_LIMIT_SKIP_IPS: ',,' })).toBe(false)
    expect(shouldSkipThrottle(contextFor('3.143.247.187'), { RATE_LIMIT_SKIP_IPS: '' })).toBe(false)
  })
})
