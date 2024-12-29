import userEvent from '@testing-library/user-event'
import { expect, it, describe } from 'vitest'
import { AuthForm, AuthFormProps, FormVariant } from '../AuthForm'
import { fireEvent, render } from '@/test-utils/utils'

const formProps: AuthFormProps = {
  isLoading: false,
  onSubmitForm: () => {},
  variant: FormVariant.LOGIN,
}

describe('<AuthForm />', () => {
  it('Should input values in login fields', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(<AuthForm {...formProps} />)

    const email = getByTestId('email') as HTMLInputElement
    const password = getByTestId('password') as HTMLInputElement

    await user.type(email, 'test@mail.com')
    await user.type(password, 'test')

    expect(email.value).toBe('test@mail.com')
    expect(password.value).toBe('test')
  })

  it('Should input values in signup fields', async () => {
    const user = userEvent.setup()
    const { getByTestId } = render(
      <AuthForm
        {...formProps}
        variant={FormVariant.SIGNUP}
      />
    )

    const email = getByTestId('email') as HTMLInputElement
    const password = getByTestId('password') as HTMLInputElement
    const name = getByTestId('name') as HTMLInputElement

    await user.type(email, 'test@mail.com')
    await user.type(password, 'test')
    await user.type(name, 'Adam')

    expect(email.value).toBe('test@mail.com')
    expect(password.value).toBe('test')
    expect(name.value).toBe('Adam')
  })

  it('Should display title and privacy text', async () => {
    const { getByText } = render(
      <AuthForm
        {...formProps}
        variant={FormVariant.SIGNUP}
      />
    )

    const title = getByText('Create your Dionis account')
    const privacy = getByText('Creating an account, you agree to our terms and privacy policy.')

    expect(title).toBeInTheDocument()
    expect(privacy).toBeInTheDocument()
  })

  it('Should disable submit button if loading', async () => {
    const { getByRole } = render(
      <AuthForm
        {...formProps}
        variant={FormVariant.SIGNUP}
        isLoading={true}
      />
    )
    const button = getByRole('button')

    expect(button).toBeDisabled()
  })

  it('Should empty name and pasward fields and return form data after submit', () => {
    let submittedFormData

    const { getByTestId } = render(
      <AuthForm
        {...formProps}
        variant={FormVariant.SIGNUP}
        onSubmitForm={(data) => (submittedFormData = data)}
      />
    )

    const email = getByTestId('email') as HTMLInputElement
    const password = getByTestId('password') as HTMLInputElement
    const name = getByTestId('name') as HTMLInputElement
    const button = getByTestId('submit-button')

    expect(email.value).toBe('')
    expect(password.value).toBe('')
    expect(name.value).toBe('')

    fireEvent.change(email, { target: { value: 'test@mail.com' } })
    fireEvent.change(password, { target: { value: 'test' } })
    fireEvent.change(name, { target: { value: 'Adam' } })

    expect(email.value).toBe('test@mail.com')
    expect(password.value).toBe('test')
    expect(name.value).toBe('Adam')

    fireEvent.click(button)

    expect(email.value).toBe('test@mail.com')
    expect(password.value).toBe('')
    expect(name.value).toBe('')

    let expectedFormData = { email: 'test@mail.com', password: 'test', name: 'Adam' }

    expect(submittedFormData).toStrictEqual(expectedFormData)
  })
})
