import axios from 'axios'
import { useEffect, useState } from 'react'

// Create an Axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:3500/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export const useRefreshToken = async (accessToken: string | null) => {
  const [token, setToken] = useState(accessToken)
  const refreshToken = async () => {
    try {
      const response = await apiClient.get('/refreshToken')
      return response.data.accessToken
    } catch (error) {
      throw new Error('Unable to refresh token')
    }
  }

  useEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use(
      (config) => {
        if (!config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        if (error.response.status === 403 && !originalRequest._retry) {
          originalRequest._retry = true

          const newAccessToken = await refreshToken()
          setToken(newAccessToken)
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
          return apiClient(originalRequest)
        }
        return Promise.reject(error)
      }
    )

    return () => {
      apiClient.interceptors.response.eject(responseInterceptor)
      apiClient.interceptors.request.eject(requestInterceptor)
    }
  }, [token, refreshToken])

  return token
}
