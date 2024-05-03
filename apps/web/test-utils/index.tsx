import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

import { GlobalStateProvider } from '@/providers/store/GlobalStateContext'
import { Theme, ThemeStateProvider } from '@/providers/theme'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <GlobalStateProvider>
      <ThemeStateProvider mode={Theme.LIGHT}>{children}</ThemeStateProvider>
    </GlobalStateProvider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
