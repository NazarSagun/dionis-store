import { renderPasswordReset } from './password-reset-template'

describe('renderPasswordReset', () => {
  it('links the reset page in both bodies', () => {
    const { subject, html, text } = renderPasswordReset('http://localhost:3000/reset-password?token=abc_-1')

    expect(subject).toBe('Reset your Dionis Store password')
    expect(html).toContain('href="http://localhost:3000/reset-password?token=abc_-1"')
    expect(text).toContain('http://localhost:3000/reset-password?token=abc_-1')
  })
})
