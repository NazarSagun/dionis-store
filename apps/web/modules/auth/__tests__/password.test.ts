import { describe, expect, it } from 'vitest'

import { newPasswordErrors } from '../domain/password'

describe('newPasswordErrors', () => {
  it('accepts two equal passwords of 8 to 72 characters', () => {
    expect(newPasswordErrors('password1', 'password1')).toEqual({})
    expect(newPasswordErrors('a'.repeat(72), 'a'.repeat(72))).toEqual({})
  })

  it('rejects a password that is too short or too long', () => {
    expect(newPasswordErrors('short', 'short').password).toBe('Use 8 to 72 characters')
    expect(newPasswordErrors('a'.repeat(73), 'a'.repeat(73)).password).toBe('Use 8 to 72 characters')
  })

  it('rejects a confirmation that differs', () => {
    expect(newPasswordErrors('password1', 'password2')).toEqual({ confirm: 'Passwords do not match' })
  })
})
