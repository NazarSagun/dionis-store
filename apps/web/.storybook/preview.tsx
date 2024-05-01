import type { Preview } from '@storybook/react'

import { GlobalStateProvider } from '../providers/store/GlobalStateContext'

import React from 'react'
import { ThemeButton } from './ThemeButton'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#2c3e50',
        },
        {
          name: 'light',
          value: '#f8f8f8',
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
  decorators: [
    (Story) => (
      <GlobalStateProvider>
        <ThemeButton />
        <Story />
      </GlobalStateProvider>
    ),
  ],
}

export default preview
