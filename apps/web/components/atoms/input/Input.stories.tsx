import type { Meta, StoryObj } from '@storybook/react'

import { Theme } from '@/providers/theme/ThemeContext'
import { ThemeProvider } from '@/providers/theme/ThemeProvider'

import { Input } from './Input'

const meta = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onChange: () => {},
    name: 'Text',
  },
  argTypes: {
    type: {
      control: 'radio',
      options: ['text', 'email', 'password'],
    },
    name: {
      defaultValue: 'Text',
      control: 'text',
    },
    onChange: {
      table: {
        disable: true,
      },
    },
  },
} satisfies Meta<typeof Input>

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
