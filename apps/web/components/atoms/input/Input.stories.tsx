import type { Meta, StoryObj } from '@storybook/react'

import { Input } from './Input'

const meta = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    name: 'Text',
    label: 'Label',
    errorMessage: '',
  },
  argTypes: {
    type: {
      defaultValue: 'text',
      control: 'radio',
      options: ['text', 'email', 'password'],
    },
    name: {
      defaultValue: 'Text',
      control: 'text',
    },
    onInputChange: {
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
}
