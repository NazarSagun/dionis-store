'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Skeleton } from '@repo/ui'

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
      <div className='flex min-h-screen w-full flex-col items-center gap-4 px-[35px] pt-16'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-40 w-full max-w-[1200px]' />
      </div>
    )
  }

  return children
}
