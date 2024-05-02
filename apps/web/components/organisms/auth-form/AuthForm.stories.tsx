import type { Meta, StoryObj } from '@storybook/react'

import { AuthForm } from './AuthForm'
import { Theme, ThemeStateProvider } from '@/providers/theme'

const meta = {
  title: 'Organisms/AuthForm',
  component: AuthForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    variant: 'login',
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
    variant: {
      defaultValue: 'login',
      control: 'radio',
      options: ['login', 'signup'],
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
    },
    values: [
      {
        name: 'light',
        value: '#f8f8f8',
      },
    ],
  },
  decorators: (Story) => <ThemeStateProvider mode={Theme.LIGHT}>{Story()}</ThemeStateProvider>,
}
