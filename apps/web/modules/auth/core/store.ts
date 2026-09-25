'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { AuthUser } from '../domain/models'

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  user: AuthUser | null
  login: (token: string, name: string) => void
  logout: () => void
  setUserName: (name: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      user: null,
      login: (token, name) => set({ isAuthenticated: true, accessToken: token, user: { name } }),
      logout: () => set({ isAuthenticated: false, accessToken: null, user: null }),
      setUserName: (name) => set((state) => ({ user: state.user ? { ...state.user, name } : state.user })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, accessToken: state.accessToken }),
    },
  ),
)
