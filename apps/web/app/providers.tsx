'use client'

import type { ReactNode } from 'react'
import { Toaster } from '@repo/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthInitializer } from '@/modules/auth/presentation/auth-initializer/AuthInitializer'
import { WishlistSync } from '@/modules/wishlist/presentation/wishlist-sync/WishlistSync'

const queryClient = new QueryClient()

export const Providers = ({ children }: Readonly<{ children: ReactNode }>) => (
  <QueryClientProvider client={queryClient}>
    <AuthInitializer>
      {/*
        Toaster must mount before children: it subscribes its listener
        in a useEffect, and sibling effects fire in render order. A
        page's own mount-time effect calling toast() (e.g. the login
        page's session-expired message) would otherwise dispatch
        before Toaster is listening, and the toast would silently
        never appear.
      */}
      <Toaster />
      <WishlistSync />
      {children}
    </AuthInitializer>
  </QueryClientProvider>
)
