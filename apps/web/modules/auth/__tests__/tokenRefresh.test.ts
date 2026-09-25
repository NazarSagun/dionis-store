import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { refreshAccessToken } from '../core/actions/tokenRefresh'
import { useAuthStore } from '../core/store'
import { refresh } from '../integration/repository'

vi.mock('../integration/repository', () => ({
  AXIOS_INSTANCE: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } },
  refresh: vi.fn(),
}))

describe('refreshAccessToken', () => {
  const originalLocation = window.location

  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ isAuthenticated: false, accessToken: null, user: null })
    Object.defineProperty(window, 'location', { value: { href: '/' }, writable: true })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true })
    vi.mocked(refresh).mockReset()
  })

  it('Should log in with the refreshed token', async () => {
    vi.mocked(refresh).mockResolvedValue({ user: { accessToken: 'new-token', name: 'Player' } } as never)

    await expect(refreshAccessToken()).resolves.toBe('new-token')

    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: true, accessToken: 'new-token' })
  })

  it('Should log out and redirect when an authenticated session fails to refresh', async () => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: 'old-token', user: { name: 'Player' } })
    vi.mocked(refresh).mockRejectedValue(new Error('401'))

    await expect(refreshAccessToken()).resolves.toBeNull()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(window.location.href).toBe('/login?sessionExpired=1')
  })

  it('Should leave an anonymous visitor alone when refresh fails', async () => {
    vi.mocked(refresh).mockRejectedValue(new Error('401'))

    await expect(refreshAccessToken()).resolves.toBeNull()

    expect(window.location.href).toBe('/')
  })
})
