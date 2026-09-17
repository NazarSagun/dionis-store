import React, { ReactElement } from 'react'
import { render, RenderOptions, cleanup } from '@testing-library/react'
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import * as matchers from "@testing-library/jest-dom/matchers";
import { GlobalStateProvider } from '@/providers/store/GlobalStateContext'
import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { serviceWorker } from './mock-server';

expect.extend(matchers);

// next-themes reads window.matchMedia, which jsdom does not implement.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

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
        <ThemeProvider attribute='class' defaultTheme='dark' enableSystem={false} forcedTheme='dark'>
          {children}
        </ThemeProvider>
      </GlobalStateProvider>
    </QueryClientProvider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
