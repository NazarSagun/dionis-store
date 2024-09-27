import React, { ReactElement } from 'react'
import { render, RenderOptions, cleanup } from '@testing-library/react'
import { expect, afterEach, beforeAll, afterAll } from 'vitest';
import * as matchers from "@testing-library/jest-dom/matchers";
import { GlobalStateProvider } from '@/providers/store/GlobalStateContext'
import { Theme, ThemeStateProvider } from '@/providers/theme'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { serviceWorker } from './mock-server';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Start worker before all tests
beforeAll(() => { serviceWorker.listen() })

//  Close worker after all tests
afterAll(() => {serviceWorker.close()})

// Reset handlers after each test `important for test isolation`
afterEach(() => {serviceWorker.resetHandlers()})

const client = new QueryClient()

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={client}>
      <GlobalStateProvider>
        <ThemeStateProvider mode={Theme.DARK}>{children}</ThemeStateProvider>
      </GlobalStateProvider>
    </QueryClientProvider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
