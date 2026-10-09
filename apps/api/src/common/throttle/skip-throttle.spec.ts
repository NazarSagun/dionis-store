import { ExecutionContext } from '@nestjs/common'
import { BYPASS_HEADER, shouldSkipThrottle } from './skip-throttle'

const TOKEN = 'a'.repeat(32)

const contextFor = (headers: Record<string, string | string[] | undefined>) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ headers }) }) }) as unknown as ExecutionContext

describe('shouldSkipThrottle', () => {
  it('limits every request when nothing is set', () => {
    expect(shouldSkipThrottle(contextFor({ [BYPASS_HEADER]: TOKEN }), {})).toBe(false)
  })

  it('exempts everyone when RATE_LIMIT is off', () => {
    expect(shouldSkipThrottle(contextFor({}), { RATE_LIMIT: 'off' })).toBe(true)
  })

  it('exempts a request that sends the right token', () => {
    expect(shouldSkipThrottle(contextFor({ [BYPASS_HEADER]: TOKEN }), { RATE_LIMIT_BYPASS_TOKEN: TOKEN })).toBe(true)
  })

  it('limits a request with no token, a wrong token, or a token of another length', () => {
    const env = { RATE_LIMIT_BYPASS_TOKEN: TOKEN }

    expect(shouldSkipThrottle(contextFor({}), env)).toBe(false)
    expect(shouldSkipThrottle(contextFor({ [BYPASS_HEADER]: 'b'.repeat(32) }), env)).toBe(false)
    expect(shouldSkipThrottle(contextFor({ [BYPASS_HEADER]: TOKEN.slice(1) }), env)).toBe(false)
    expect(shouldSkipThrottle(contextFor({ [BYPASS_HEADER]: `${TOKEN}x` }), env)).toBe(false)
  })

  it('limits a request that sends the header twice', () => {
    expect(
      shouldSkipThrottle(contextFor({ [BYPASS_HEADER]: [TOKEN, TOKEN] }), { RATE_LIMIT_BYPASS_TOKEN: TOKEN }),
    ).toBe(false)
  })

  it('ignores a secret that is shorter than 32 characters, even when it matches', () => {
    expect(shouldSkipThrottle(contextFor({ [BYPASS_HEADER]: 'short' }), { RATE_LIMIT_BYPASS_TOKEN: 'short' })).toBe(
      false,
    )
    expect(shouldSkipThrottle(contextFor({ [BYPASS_HEADER]: '' }), { RATE_LIMIT_BYPASS_TOKEN: '' })).toBe(false)
  })
})
