import type { Meta, StoryObj } from '@storybook/react'

import { ThemeProvider } from 'next-themes'

import { ThemeToggle } from './ThemeToggle'

const meta = {
  title: 'ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeToggle>

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
  decorators: (Story) => (
    <ThemeProvider attribute='class' forcedTheme='dark'>
      {Story()}
    </ThemeProvider>
  ),
  render: (args) => <ThemeToggle {...args} />,
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
  decorators: (Story) => (
    <ThemeProvider attribute='class' forcedTheme='light'>
      {Story()}
    </ThemeProvider>
  ),
  render: (args) => <ThemeToggle {...args} />,
}
