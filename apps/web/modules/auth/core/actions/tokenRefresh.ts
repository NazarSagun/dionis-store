import { AXIOS_INSTANCE, refresh } from '../../integration/repository'
import { useAuthStore } from '../store'

// Shared by every caller so concurrent 401s trigger one /refresh call, not one per request.
let refreshPromise: Promise<string | null> | null = null

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refresh()
      .then((result) => {
        const { accessToken, name } = result.user ?? {}
        if (!accessToken || !name) return null
        useAuthStore.getState().login(accessToken, name)
        return accessToken
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

let interceptorsRegistered = false

// Reads the store directly via getState() instead of closing over a React
// value, so it never goes stale and can be registered once, outside any
// component's render/effect lifecycle.
export function setupAuthInterceptors() {
  if (interceptorsRegistered) return
  interceptorsRegistered = true

  AXIOS_INSTANCE.interceptors.request.use((config) => {
    if (!config.headers['Authorization']) {
      const token = useAuthStore.getState().accessToken
      if (token) config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  })

  AXIOS_INSTANCE.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true
        const newAccessToken = await refreshAccessToken()
        if (newAccessToken) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
          return AXIOS_INSTANCE(originalRequest)
        }
        useAuthStore.getState().logout()
      }
      return Promise.reject(error)
    },
  )
}
