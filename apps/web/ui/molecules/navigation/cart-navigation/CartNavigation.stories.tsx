import type { Meta, StoryObj } from '@storybook/react'

import { Theme, ThemeStateProvider } from '@/providers/theme'

import { CartNavigation } from './CartNavigation'

const meta = {
  title: 'Molecules/CartNavigation',
  component: CartNavigation,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    activeStep: 1
  },
  argTypes: {
    activeStep: {
      control: 'radio',
      options: [1, 2, 3]
    },
  }
} satisfies Meta<typeof CartNavigation>

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
