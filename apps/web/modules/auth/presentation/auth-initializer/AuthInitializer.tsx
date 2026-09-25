'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Skeleton } from '@repo/ui'

import { useRefreshToken } from '../../core/facade'

interface AuthInitializerProps {
  children: ReactNode
}

export const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const [isHydrated, setIsHydrated] = useState(false)
  useRefreshToken()

  // useAuthStore restores its persisted state as soon as the store is created
  // in the browser. The server has no localStorage, so wait for the mount
  // before rendering auth-dependent children, to keep the first client
  // render identical to the server HTML.
  useEffect(() => {
    setIsHydrated(true)
  }, [])

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
