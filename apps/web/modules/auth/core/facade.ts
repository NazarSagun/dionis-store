'use client'

import { useEffect } from 'react'

import { refreshAccessToken, setupAuthInterceptors } from './actions/tokenRefresh'
import { useAuthStore } from './store'

export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthUser = () => useAuthStore((state) => state.user)

export const useAuthLogin = () => useAuthStore((state) => state.login)
export const useAuthLogout = () => useAuthStore((state) => state.logout)
export const useAuthHydrate = () => useAuthStore((state) => state.hydrate)
export const useSetAuthUserName = () => useAuthStore((state) => state.setUserName)

export const useRefreshToken = () => {
  useEffect(() => {
    setupAuthInterceptors()
    refreshAccessToken()
  }, [])
}
