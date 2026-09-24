import React, { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup, render, RenderOptions } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, expect } from 'vitest'

import { useRecentlyViewedStore } from '@/modules/account/core/store'
import { useAuthStore } from '@/modules/auth/core/store'
import { useCartStore } from '@/modules/cart/core/store'

import { serviceWorker } from './mock-server'

expect.extend(matchers)

afterEach(() => {
  cleanup()
  localStorage.clear()
  useAuthStore.setState({ isAuthenticated: false, accessToken: null, user: null })
  useCartStore.setState({ items: [], currentStep: 1, orderId: null })
  useRecentlyViewedStore.setState({ gameIds: [] })
})

// Start worker before all tests
beforeAll(() => {
  serviceWorker.listen()
})

//  Close worker after all tests
afterAll(() => {
  serviceWorker.close()
})

// Reset handlers after each test `important for test isolation`
afterEach(() => {
  serviceWorker.resetHandlers()
})

const client = new QueryClient()

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
