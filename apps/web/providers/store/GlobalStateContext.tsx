'use client'

import { createContext, Dispatch, ReactNode, useContext, useEffect, useReducer } from 'react'

import { globalInitialState, GlobalState, rootReducer } from './reducers'
import { ActionType } from './types'
import { AuthActionType } from './actions'
import { useRefreshToken } from './useRefreshToken'

interface GlobalInitialState {
  state: GlobalState
  dispatch: Dispatch<ActionType>
}

type GlobalStateProviderProps = {
  children: ReactNode
}

export const GlobalStateContext = createContext<GlobalInitialState | undefined>(undefined)
GlobalStateContext.displayName = 'GlobalStateContext'

export const GlobalStateProvider = async ({ children }: GlobalStateProviderProps) => {
  const [state, dispatch] = useReducer(rootReducer, globalInitialState)
  const token = useRefreshToken(state.auth.accessToken)

  useEffect(() => {
    dispatch({ type: AuthActionType.LOGIN, payload: token })
  }, [token])

  return <GlobalStateContext.Provider value={{ state, dispatch }}>{children}</GlobalStateContext.Provider>
}

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext)
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider')
  }
  return context
}
