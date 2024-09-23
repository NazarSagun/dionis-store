import type { Meta, StoryObj } from '@storybook/react'

import { Theme, ThemeStateProvider } from '@/providers/theme'

import { DropdownAppearence } from './DropdownAppearence'

const meta = {
  title: 'Atoms/Dropdown',
  component: DropdownAppearence,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownAppearence>

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
  render: (args) => <DropdownAppearence {...args} />,
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
  render: (args) => <DropdownAppearence {...args} />,
}
