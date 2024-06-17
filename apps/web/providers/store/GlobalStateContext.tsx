'use client'

import { createContext, Dispatch, ReactNode, useContext, useEffect, useReducer, useState } from 'react'

import { globalInitialState, GlobalState, rootReducer } from './reducers'
import { ActionType } from './types'
import { useRefreshToken } from './useRefreshToken'
import { AuthActionType } from './actions'
import { Progress } from '@/components/atoms/progress/Progress'

interface GlobalInitialState {
  state: GlobalState
  dispatch: Dispatch<ActionType>
}

type GlobalStateProviderProps = {
  children: ReactNode
}

export const GlobalStateContext = createContext<GlobalInitialState | undefined>(undefined)
GlobalStateContext.displayName = 'GlobalStateContext'

export const GlobalStateProvider = ({ children }: GlobalStateProviderProps) => {
  const [state, dispatch] = useReducer(rootReducer, globalInitialState)
  const [loading, setLoading] = useState(true)
  useRefreshToken()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      dispatch({ type: AuthActionType.AUTHENTICATE, payload: token })
    }

    const timeout = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {loading ? <Progress duration={1500} /> : children}
    </GlobalStateContext.Provider>
  )
}

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext)
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider')
  }
  return context
}
