import { render } from '@/test-utils/utils'
import { Toaster, useToast } from '@/ui'
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
