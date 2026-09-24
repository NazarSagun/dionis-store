import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '../core/store'

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ isAuthenticated: false, accessToken: null, user: null })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('Should update authentication state correctly on login', () => {
    useAuthStore.getState().login('123', 'test')

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: true,
      accessToken: '123',
      user: { name: 'test' },
    })
    expect(localStorage.getItem('token')).toBe('123')
  })

  it('Should log out and clear state correctly', () => {
    useAuthStore.getState().login('123', 'test')
    useAuthStore.getState().logout()

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      accessToken: null,
      user: null,
    })
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('Should hydrate isAuthenticated and accessToken from a stored token', () => {
    localStorage.setItem('token', 'stored-token')

    useAuthStore.getState().hydrate()

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: true,
      accessToken: 'stored-token',
    })
  })

  it('Should not authenticate on hydrate when no token is stored', () => {
    useAuthStore.getState().hydrate()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('Should update the signed-in user’s name without touching the token', () => {
    useAuthStore.getState().login('123', 'test')

    useAuthStore.getState().setUserName('renamed')

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: true,
      accessToken: '123',
      user: { name: 'renamed' },
    })
  })

  it('Should do nothing when no user is signed in', () => {
    useAuthStore.getState().setUserName('renamed')

    expect(useAuthStore.getState().user).toBeNull()
  })
})
