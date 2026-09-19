import type { Meta, StoryObj } from '@storybook/react'

import { Skeleton } from './Skeleton'

const meta = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Component: Story = {
  args: {
    className: 'h-12 w-48',
  },
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
  render: (args) => <Skeleton {...args} />,
}
