import { expect, describe, it } from 'vitest'
import { authReducer, AuthState } from '../authReducer'
import { AuthActionType } from '../../actions'

describe('Auth reducer', () => {
  it('Should update authentication state correctly', () => {
    const expectedResult: AuthState = { isAuthenticated: true, accessToken: '123' }
    const output = authReducer(
      { isAuthenticated: false, accessToken: null },
      { type: AuthActionType.AUTHENTICATE, payload: '123' }
    )

    expect(output).toStrictEqual(expectedResult)
  })

  it('Should logout and update state correctly', () => {
    const expectedResult: AuthState = { isAuthenticated: false, accessToken: null }
    const output = authReducer({ isAuthenticated: true, accessToken: '123' }, { type: AuthActionType.LOGOUT })

    expect(output).toStrictEqual(expectedResult)
  })
})
