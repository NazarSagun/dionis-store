import type { Meta, StoryObj } from '@storybook/react'

import { Input } from './Input'
import { Theme, ThemeStateProvider } from '@/providers/theme'

const meta = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    name: 'Text',
    type: 'text',
  },
  argTypes: {
    type: {
      control: 'radio',
      options: ['text', 'email', 'password'],
    },
    onInputChange: {
      table: {
        disable: true,
      },
    },
    name: {
      table: {
        disable: true,
      },
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Dark: Story = {
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
  decorators: (Story) => <ThemeStateProvider mode={Theme.DARK}>{Story()}</ThemeStateProvider>,
}

export const Light: Story = {
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
  decorators: (Story) => <ThemeStateProvider mode={Theme.LIGHT}>{Story()}</ThemeStateProvider>,
}
