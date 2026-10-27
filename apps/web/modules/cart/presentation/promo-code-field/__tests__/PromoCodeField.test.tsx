import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { serviceWorker } from '@/test-utils/mock-server'
import { render, screen, waitFor } from '@/test-utils/utils'

import { PromoCodeField } from '../PromoCodeField'

const TIMEOUT = 3000

describe('<PromoCodeField />', () => {
  it('keeps Apply disabled until a code is typed', async () => {
    render(<PromoCodeField paymentIntentId='pi_1' applied={null} onApplied={vi.fn()} onRemoved={vi.fn()} />)
    expect(screen.getByTestId('promo-code-apply')).toBeDisabled()

    await userEvent.type(screen.getByTestId('promo-code-input'), 'SAVE10')

    expect(screen.getByTestId('promo-code-apply')).toBeEnabled()
  })

  it('sends the typed code and reports the amounts the API returned', async () => {
    let sent: unknown
    serviceWorker.use(
      http.put('*/orders/payment-intent/pi_2/promo', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ amount: 2700, discountCents: 300, code: 'SAVE10' })
      }),
    )
    const onApplied = vi.fn()
    render(<PromoCodeField paymentIntentId='pi_2' applied={null} onApplied={onApplied} onRemoved={vi.fn()} />)

    await userEvent.type(screen.getByTestId('promo-code-input'), ' save10 ')
    await userEvent.click(screen.getByTestId('promo-code-apply'))

    await waitFor(
      () => expect(onApplied).toHaveBeenCalledWith({ code: 'SAVE10', discountCents: 300, amountCents: 2700 }),
      {
        timeout: TIMEOUT,
      },
    )
    expect(sent).toEqual({ code: 'save10' })
  })

  it('shows the API message, keeps the typed text, and reports nothing', async () => {
    serviceWorker.use(
      http.put('*/orders/payment-intent/pi_3/promo', () =>
        HttpResponse.json({ message: 'That code has expired.' }, { status: 400 }),
      ),
    )
    const onApplied = vi.fn()
    render(<PromoCodeField paymentIntentId='pi_3' applied={null} onApplied={onApplied} onRemoved={vi.fn()} />)

    await userEvent.type(screen.getByTestId('promo-code-input'), 'OLD')
    await userEvent.click(screen.getByTestId('promo-code-apply'))

    await waitFor(() => expect(screen.getByTestId('promo-code-error')).toHaveTextContent('That code has expired.'), {
      timeout: TIMEOUT,
    })
    expect(screen.getByTestId('promo-code-input')).toHaveValue('OLD')
    expect(onApplied).not.toHaveBeenCalled()
  })

  it('shows the applied code with Remove, and Remove tells the parent once the API agrees', async () => {
    serviceWorker.use(http.delete('*/orders/payment-intent/pi_4/promo', () => HttpResponse.json({ amount: 3000 })))
    const onRemoved = vi.fn()
    render(
      <PromoCodeField
        paymentIntentId='pi_4'
        applied={{ code: 'SAVE10', discountCents: 300, amountCents: 2700 }}
        onApplied={vi.fn()}
        onRemoved={onRemoved}
      />,
    )
    expect(screen.getByTestId('promo-code-applied')).toHaveTextContent('SAVE10')
    expect(screen.queryByTestId('promo-code-input')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('promo-code-remove'))

    await waitFor(() => expect(onRemoved).toHaveBeenCalled(), { timeout: TIMEOUT })
  })
})
