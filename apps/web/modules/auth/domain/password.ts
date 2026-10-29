// The register rule: bcrypt ignores every byte after the 72nd.
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72

export interface NewPasswordErrors {
  password?: string
  confirm?: string
}

// Checks the two fields of the reset form before anything goes to the API.
export function newPasswordErrors(password: string, confirm: string): NewPasswordErrors {
  const errors: NewPasswordErrors = {}
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    errors.password = `Use ${PASSWORD_MIN} to ${PASSWORD_MAX} characters`
  }
  if (confirm !== password) errors.confirm = 'Passwords do not match'
  return errors
}
