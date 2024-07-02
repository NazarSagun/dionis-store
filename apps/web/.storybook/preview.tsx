import type { Preview } from '@storybook/react'
import '../app/globals.css'

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
}

export default preview
