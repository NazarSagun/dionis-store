import type { Meta, StoryObj } from '@storybook/react'

import { AuthForm, FormVariant } from './AuthForm'

const meta = {
  title: 'Organisms/AuthForm',
  component: AuthForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    isLoading: false,
    variant: FormVariant.LOGIN,
    onSubmitForm(userData) {
      console.log(userData)
    },
  },
  argTypes: {
    variant: {
      defaultValue: FormVariant.LOGIN,
      control: 'radio',
      options: [FormVariant.LOGIN, FormVariant.SIGNUP],
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
  decorators: (Story) => <div className='dark'>{Story()}</div>,
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
}
