import type { Meta, StoryObj } from '@storybook/react'

import { Theme, ThemeStateProvider } from '@/providers/theme'

import { Card } from './Card'

const meta = {
  title: 'Molecules/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {},
  argTypes: {},
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Dark: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#343434',
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
        value: '#fcfafa',
      },
    ],
  },
  decorators: (Story) => <ThemeStateProvider mode={Theme.LIGHT}>{Story()}</ThemeStateProvider>,
}
