import { promises as dns } from 'node:dns'
import { hasMailServer, isDisposableEmail } from './email-domain.util'

describe('isDisposableEmail', () => {
  it('flags a throwaway domain', () => {
    expect(isDisposableEmail('a@mailinator.com')).toBe(true)
  })

  it('allows a normal and a reserved test domain', () => {
    expect(isDisposableEmail('a@gmail.com')).toBe(false)
    expect(isDisposableEmail('player@dionis-store.test')).toBe(false)
  })
})

describe('hasMailServer', () => {
  afterEach(() => jest.restoreAllMocks())

  it('skips the lookup for a reserved TLD', async () => {
    const spy = jest.spyOn(dns, 'resolveMx')
    expect(await hasMailServer('player@dionis-store.test')).toBe(true)
    expect(spy).not.toHaveBeenCalled()
  })

  it('rejects a domain with no MX record', async () => {
    jest.spyOn(dns, 'resolveMx').mockRejectedValue(Object.assign(new Error(), { code: 'ENOTFOUND' }))
    expect(await hasMailServer('a@nope.com')).toBe(false)
  })

  it('fails open on a DNS outage', async () => {
    jest.spyOn(dns, 'resolveMx').mockRejectedValue(Object.assign(new Error(), { code: 'ETIMEOUT' }))
    expect(await hasMailServer('a@gmail.com')).toBe(true)
  })
})
