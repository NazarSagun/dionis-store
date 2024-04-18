import type { Meta, StoryObj } from '@storybook/react'

import { Theme } from '@/providers/theme/ThemeContext'
import { ThemeProvider } from '@/providers/theme/ThemeProvider'

import { AuthForm } from './AuthForm'

const meta = {
  title: 'Organisms/AuthForm',
  component: AuthForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onSubmitForm(userData) {
      console.log(userData)
    },
    title: 'Create Dionis account',
    privacyText: 'By creating an account, you agree to our terms and privacy policy.',
  },
  argTypes: {
    title: {
      control: 'text',
    },
    privacyText: {
      control: 'text',
    },
    onSubmitForm: {
      table: {
        disable: true,
      },
    },
  },
} satisfies Meta<typeof AuthForm>

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
