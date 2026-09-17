import type { Meta, StoryObj } from '@storybook/react'

import { Toaster } from './Toaster'
import { Button } from '../button'
import { useToast } from './use-toast'

function ToastComponent() {
  const { toast } = useToast()

  return (
    <div>
      <Button
        onClick={() =>
          toast({
            variant: 'destructive',
            title: 'Toast',
          })
        }
      >
        Click
      </Button>
    </div>
  )
}

const meta = {
  title: 'Molecules/Toaster',
  component: Toaster,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Component: Story = {
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
  decorators: () => (
    <div className='dark'>
      <ToastComponent />
      <Toaster />
    </div>
  ),
}
