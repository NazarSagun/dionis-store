import type { Meta, StoryObj } from '@storybook/react'

import { Theme } from '@/providers/theme/ThemeContext'
import { ThemeProvider } from '@/providers/theme/ThemeProvider'

import { Button } from './Button'

const meta = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onClick: () => {},
    label: 'Text',
    variant: 'primary',
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['primary', 'secondary'],
    },
    label: {
      defaultValue: 'Text',
      control: 'text',
    },
    onClick: {
      table: {
        disable: true,
      },
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Dark: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider mode={Theme.DARK}>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#2c3e50',
        },
      ],
    },
  },
}

export const Light: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider mode={Theme.LIGHT}>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    backgrounds: {
      default: 'light',
    },
    values: [
      {
        name: 'light',
        value: '#f8f8f8',
      },
    ],
  },
}
