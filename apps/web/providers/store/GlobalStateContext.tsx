'use client'

import { createContext, Dispatch, ReactNode, useContext, useEffect, useReducer, useState } from 'react'

import { globalInitialState, GlobalState, rootReducer } from './reducers'
import { ActionType } from './types'
import { useRefreshToken } from './useRefreshToken'
import { AuthActionType } from './actions'
import { jwtDecode, JwtPayload } from 'jwt-decode'
import { Loader } from '@/components/atoms'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const accessToken = useRefreshToken()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      console.log('Remove token')
      router.push('/login')
      dispatch({ type: AuthActionType.LOGOUT })
    } else {
      console.log('Add token')
      dispatch({ type: AuthActionType.AUTHENTICATE, payload: token })
    }

    setLoading(false)
  }, [])

  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {loading ? <Loader /> : children}
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
