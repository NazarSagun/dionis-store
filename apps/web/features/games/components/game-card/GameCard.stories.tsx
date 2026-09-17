import type { Meta, StoryObj } from '@storybook/react'

import { GameCard } from './GameCard'

const meta = {
  title: 'Games/GameCard',
  component: GameCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {},
  argTypes: {
    onClick: {
      table: {
        disable: true,
      },
    },
    imageSrc: {
      table: {
        disable: true,
      },
    },
  },
} satisfies Meta<typeof GameCard>

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
  args: {
    title: 'Overwatch',
    rating: '4.4',
    price: 55,
    platform: 'Windows',
    imageSrc: 'https://www.freetogame.com/g/1/thumbnail.jpg',
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
        value: '#fcfafa',
      },
    ],
  },
  args: {
    title: 'Overwatch',
    rating: '4.4',
    price: 55,
    platform: 'Windows',
    imageSrc: 'https://www.freetogame.com/g/1/thumbnail.jpg',
  },
}
