import type { Meta, StoryObj } from '@storybook/react'

import { Theme, ThemeStateProvider } from '@/providers/theme'

import { Toaster } from './Toaster'
import { Button } from '@/ui/atoms'
import { useToast } from '@/ui'

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
    <ThemeStateProvider mode={Theme.DARK}>
      <ToastComponent />
      <Toaster />
    </ThemeStateProvider>
  ),
}
