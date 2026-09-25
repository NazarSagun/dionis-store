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
      .catch(() => {
        // An anonymous visitor also hits this catch on every page load (no
        // refresh cookie yet), so only a session that WAS authenticated
        // counts as an expiry worth logging out for and telling the user
        // about. useAuthStore's persist middleware has already restored
        // isAuthenticated by the time this runs. Redirecting here (not via a
        // component effect) guarantees it fires from both call sites: this
        // mount-time refresh and the response interceptor below.
        if (useAuthStore.getState().isAuthenticated) {
          useAuthStore.getState().logout()
          window.location.href = '/login?sessionExpired=1'
        }
        return null
      })
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
      // A 401 on /refresh itself must never re-enter refreshAccessToken():
      // that call is already the in-flight promise this branch would await,
      // so retrying here deadlocks it forever and its own .catch() (which
      // logs the user out) never runs. Let it reject straight through.
      const isRefreshRequest = originalRequest?.url === '/refresh'
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
        originalRequest._retry = true
        const newAccessToken = await refreshAccessToken()
        if (newAccessToken) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
          return AXIOS_INSTANCE(originalRequest)
        }
        // refreshAccessToken() already logged out and redirected above when
        // this request had actually been authenticated.
      }
      return Promise.reject(error)
    },
  )
}
