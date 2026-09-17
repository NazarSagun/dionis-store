import { render } from '@testing-library/react'
import { Toaster } from '../Toaster'
import { useToast } from '../use-toast'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'

function ToastComponent() {
  const { toast } = useToast()

  return (
    <div>
      <button
        data-testid='open-toast'
        onClick={() =>
          toast({
            variant: 'destructive',
            title: 'Toast',
          })
        }
      >
        Click
      </button>
    </div>
  )
}

it('Should render toast component after trigger', async () => {
  const user = userEvent.setup()

  const { getByTestId, findByText } = render(
    <>
      <ToastComponent />
      <Toaster />
    </>
  )

  const button = getByTestId('open-toast')
  await user.click(button)

  const toast = await findByText('Toast')
  expect(toast).toBeInTheDocument()
})
