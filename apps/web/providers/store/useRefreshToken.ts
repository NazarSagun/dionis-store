'use client'

import { useEffect, useState } from 'react'
import { AXIOS_INSTANCE } from '@repo/dionis-api/instance'
import { useRefresh } from '@repo/dionis-api/src/dionis/default/default'

export const useRefreshToken = () => {
  const [token, setToken] = useState('')
  const { data, refetch } = useRefresh()

  useEffect(() => {
    refetch()
    const requestInterceptor = AXIOS_INSTANCE.interceptors.request.use(
      (config) => {
        if (!config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )
    const responseInterceptor = AXIOS_INSTANCE.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        if (error.response.status === 403 && !originalRequest._retry) {
          originalRequest._retry = true

          if (data?.accessToken) {
            const newAccessToken = data.accessToken
            setToken(newAccessToken)
            localStorage.setItem('token', newAccessToken)
            AXIOS_INSTANCE.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
            return AXIOS_INSTANCE(originalRequest)
          }
        }
        return Promise.reject(error)
      }
    )

    return () => {
      AXIOS_INSTANCE.interceptors.response.eject(responseInterceptor)
      AXIOS_INSTANCE.interceptors.request.eject(requestInterceptor)
    }
  }, [token, data?.accessToken])

  return AXIOS_INSTANCE
}
