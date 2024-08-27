import type { Meta, StoryObj } from '@storybook/react'

import { Theme, ThemeStateProvider } from '@/providers/theme'

import { Button } from './Button'

const meta = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onClick: () => {},
    variant: 'default',
    disabled: false,
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['default', 'secondary'],
    },
    onClick: {
      table: {
        disable: true,
      },
    },
    asChild: { table: { disable: true } },
  },
} satisfies Meta<typeof Button>

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
  render: (args) => <Button {...args}>click</Button>,
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
  render: (args) => <Button {...args}>click</Button>,
}
