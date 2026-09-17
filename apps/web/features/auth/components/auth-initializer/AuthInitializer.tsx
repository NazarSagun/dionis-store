'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Loader } from '@repo/ui'

import { useRefreshToken } from '../../hooks/useRefreshToken'
import { useAuthStore } from '../../store/useAuthStore'

interface AuthInitializerProps {
  children: ReactNode
}

export const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const hydrate = useAuthStore((state) => state.hydrate)
  const [isHydrated, setIsHydrated] = useState(false)
  useRefreshToken()

  useEffect(() => {
    hydrate()
    setIsHydrated(true)
  }, [hydrate])

  if (!isHydrated) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader />
      </div>
    )
  }

  return children
}
