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
    expect(JSON.parse(localStorage.getItem('auth-storage') ?? '{}').state).toEqual({
      isAuthenticated: true,
      role: null,
    })
  })

  it('Should keep the role from login so admin UI can show, and clear it on logout', () => {
    useAuthStore.getState().login('123', 'admin', 500)
    expect(useAuthStore.getState().role).toBe(500)

    useAuthStore.getState().logout()
    expect(useAuthStore.getState().role).toBeNull()
  })

  it('Should log out and clear state correctly', () => {
    useAuthStore.getState().login('123', 'test')
    useAuthStore.getState().logout()

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      accessToken: null,
      user: null,
    })
    expect(JSON.parse(localStorage.getItem('auth-storage') ?? '{}').state).toEqual({
      isAuthenticated: false,
      role: null,
    })
  })

  it('Should restore isAuthenticated from storage and drop an access token that older sessions stored', async () => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { isAuthenticated: true, accessToken: 'stored-token' }, version: 0 }),
    )

    await useAuthStore.persist.rehydrate()

    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: true, accessToken: null })
    expect(JSON.parse(localStorage.getItem('auth-storage') ?? '{}').state).not.toHaveProperty('accessToken')
  })

  it('Should not authenticate on rehydrate when nothing is stored', async () => {
    await useAuthStore.persist.rehydrate()

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
