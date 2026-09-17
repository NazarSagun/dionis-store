import type { Meta, StoryObj } from '@storybook/react'

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
  decorators: (Story) => <div className='dark'>{Story()}</div>,
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
  render: (args) => <Button {...args}>click</Button>,
}
