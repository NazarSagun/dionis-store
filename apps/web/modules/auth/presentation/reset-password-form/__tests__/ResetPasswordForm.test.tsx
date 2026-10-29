import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { render } from '@/test-utils/utils'

import { ResetPasswordForm } from '../ResetPasswordForm'

describe('<ResetPasswordForm />', () => {
  it('shows an error and sends nothing when the passwords differ', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const { getByTestId, getByText } = render(<ResetPasswordForm onSubmit={onSubmit} isLoading={false} />)

    await user.type(getByTestId('reset-password'), 'password123')
    await user.type(getByTestId('reset-confirm'), 'password124')
    await user.click(getByTestId('reset-submit'))

    expect(getByText('Passwords do not match')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('sends the password when both fields match', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const { getByTestId } = render(<ResetPasswordForm onSubmit={onSubmit} isLoading={false} />)

    await user.type(getByTestId('reset-password'), 'password123')
    await user.type(getByTestId('reset-confirm'), 'password123')
    await user.click(getByTestId('reset-submit'))

    expect(onSubmit).toHaveBeenCalledWith('password123')
  })

  it('shows the invalid link card instead of the form', () => {
    const { getByTestId, queryByTestId } = render(
      <ResetPasswordForm
        onSubmit={vi.fn()}
        isLoading={false}
        invalidLinkMessage='This reset link is invalid or expired'
      />,
    )

    expect(getByTestId('reset-error').textContent).toContain('This reset link is invalid or expired')
    expect(queryByTestId('reset-submit')).toBeNull()
  })
})
