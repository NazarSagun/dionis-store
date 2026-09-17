'use client'

import { create } from 'zustand'

export type AuthUser = {
  name: string
}

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  user: AuthUser | null
  login: (token: string, name: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  user: null,
  login: (token, name) => {
    localStorage.setItem('token', token)
    set({ isAuthenticated: true, accessToken: token, user: { name } })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ isAuthenticated: false, accessToken: null, user: null })
  },
  hydrate: () => {
    const token = localStorage.getItem('token')
    if (token) {
      set({ isAuthenticated: true, accessToken: token })
    }
  },
}))
