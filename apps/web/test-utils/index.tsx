import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

import { GlobalStateProvider } from '@/providers/store/GlobalStateContext'
import { Theme, ThemeStateProvider } from '@/providers/theme'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'


const client = new QueryClient()

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={client}>
      <GlobalStateProvider>
        <ThemeStateProvider mode={Theme.LIGHT}>{children}</ThemeStateProvider>
      </GlobalStateProvider>
    </QueryClientProvider>
    
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
