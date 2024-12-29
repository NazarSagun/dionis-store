import { expect, describe, it } from 'vitest'
import { authReducer, AuthState } from '../authReducer'
import { AuthActionType } from '../../actions'

const userData = { name: 'test' }

describe('Auth reducer', () => {
  it('Should update authentication state correctly', () => {
    const expectedResult: AuthState = { isAuthenticated: true, accessToken: '123', user: userData }
    const output = authReducer(
      { isAuthenticated: false, accessToken: null, user: null },
      { type: AuthActionType.AUTHENTICATE, payload: { token: '123', name: 'test' } }
    )

    expect(output).toStrictEqual(expectedResult)
  })

  it('Should logout and update state correctly', () => {
    const expectedResult: AuthState = { isAuthenticated: false, accessToken: null, user: null }
    const output = authReducer(
      { isAuthenticated: true, accessToken: '123', user: userData },
      { type: AuthActionType.LOGOUT }
    )

    expect(output).toStrictEqual(expectedResult)
  })
})
