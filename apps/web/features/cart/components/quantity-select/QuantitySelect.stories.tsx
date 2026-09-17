import type { Meta, StoryObj } from '@storybook/react'

import { QuantitySelect } from './QuantitySelect'

const meta = {
  title: 'Cart/QuantitySelect',
  component: QuantitySelect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onChange: (number) => {
      console.log(number)
    },
    selectedOption: 1,
  },
  argTypes: {
    onChange: {
      table: {
        disable: true,
      },
    },
  },
} satisfies Meta<typeof QuantitySelect>

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
