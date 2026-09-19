'use client'

import { useEffect } from 'react'

import { refreshAccessToken, setupAuthInterceptors } from '../helpers'

export const useRefreshToken = () => {
  useEffect(() => {
    setupAuthInterceptors()
    refreshAccessToken()
  }, [])
}
