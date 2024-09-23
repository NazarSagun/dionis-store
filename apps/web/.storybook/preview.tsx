import type { Preview } from '@storybook/react'
import '../app/globals.css'
import { GlobalStateProvider } from '../providers/store/GlobalStateContext'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'


const queryClient = new QueryClient()

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#343434',
        },
        {
          name: 'light',
          value: '#fcfafa',
        },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: (Story) => <QueryClientProvider client={queryClient}><GlobalStateProvider>{Story()}</GlobalStateProvider></QueryClientProvider>,
}

export default preview
