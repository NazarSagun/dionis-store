import type { Preview } from '@storybook/react'

import { ThemeProvider } from '../providers/theme/ThemeProvider'
import React from 'react'
import { Theme } from '../providers/theme/ThemeContext'

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
      <ThemeProvider mode={Theme.DARK}>
        <Story />
      </ThemeProvider>
    ),
  ],
}

export default preview
