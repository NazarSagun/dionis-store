import type { Meta, StoryObj } from '@storybook/react'

import { Theme, ThemeStateProvider } from '@/providers/theme'

import { ThemeIcon } from './ThemeIcon'

const meta = {
  title: 'Atoms/Theme Icon',
  component: ThemeIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: {
      table: {
        disable: true,
      },
    },
  },
} satisfies Meta<typeof ThemeIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Component: Story = {
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#f8f8f8',
        },
      ],
    },
  },
  decorators: (Story) => <ThemeStateProvider>{Story()}</ThemeStateProvider>,
}
