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
      // role only hides or shows admin UI. The API checks the role on every admin route.
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        role: state.role,
      }),
    },
  ),
)
