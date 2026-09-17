'use client'

import { useEffect } from 'react'
import { AXIOS_INSTANCE } from '@repo/dionis-api/instance'
import { useRefresh } from '@repo/dionis-api/src/dionis/default/default'
import { useAuthStore } from '../store/useAuthStore'

export const useRefreshToken = () => {
  const { data, refetch } = useRefresh({ query: { retry: false } })
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    if (data?.user?.accessToken && data.user.name) {
      login(data.user.accessToken, data.user.name)
    }
  }, [data?.user?.accessToken, data?.user?.name, login])

  useEffect(() => {
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
        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          if (data?.user?.accessToken) {
            const newAccessToken = data.user?.accessToken
            AXIOS_INSTANCE.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
            return AXIOS_INSTANCE(originalRequest)
          }
        }
        if (error.response.status === 401 && originalRequest._retry) {
          logout()
        }
        return Promise.reject(error)
      }
    )
    return () => {
      AXIOS_INSTANCE.interceptors.response.eject(responseInterceptor)
      AXIOS_INSTANCE.interceptors.request.eject(requestInterceptor)
    }
  }, [data?.user?.accessToken, logout])
}
