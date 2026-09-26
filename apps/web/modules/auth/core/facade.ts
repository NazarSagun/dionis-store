'use client'

import { useEffect } from 'react'

import { ADMIN_ROLE } from '../domain/models'

import { refreshAccessToken, setupAuthInterceptors } from './actions/tokenRefresh'
import { useAuthStore } from './store'

export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useAuthUser = () => useAuthStore((state) => state.user)
export const useIsAdmin = () => useAuthStore((state) => state.isAuthenticated && state.role === ADMIN_ROLE)

export const useAuthLogin = () => useAuthStore((state) => state.login)
export const useAuthLogout = () => useAuthStore((state) => state.logout)
export const useSetAuthUserName = () => useAuthStore((state) => state.setUserName)

export const useRefreshToken = () => {
  useEffect(() => {
    setupAuthInterceptors()
    refreshAccessToken()
  }, [])
}
