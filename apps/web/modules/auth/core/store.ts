'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { AuthUser } from '../domain/models'

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  user: AuthUser | null
  role: number | null
  login: (token: string, name: string, role?: number) => void
  logout: () => void
  setUserName: (name: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      user: null,
      role: null,
      login: (token, name, role) =>
        set({ isAuthenticated: true, accessToken: token, user: { name }, role: role ?? null }),
      logout: () => set({ isAuthenticated: false, accessToken: null, user: null, role: null }),
      setUserName: (name) => set((state) => ({ user: state.user ? { ...state.user, name } : state.user })),
    }),
    {
      name: 'auth-storage',
      // Version 0 stored the access token. The migration drops it from storage
      // that older sessions still hold.
      version: 1,
      migrate: (persisted) => {
        const { accessToken: _accessToken, ...rest } = persisted as Record<string, unknown>
        return rest as unknown as AuthState
      },
      // The access token stays in memory, so an XSS bug cannot read it from
      // localStorage. The refresh cookie restores it after a reload. role only
      // hides or shows admin UI. The API checks the role on every admin route.
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    },
  ),
)
