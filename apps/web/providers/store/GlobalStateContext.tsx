'use client'

import { createContext, Dispatch, ReactNode, useContext, useEffect, useReducer, useState } from 'react'

import { globalInitialState, GlobalState, rootReducer } from './reducers'
import { ActionType } from './types'
import { useRefreshToken } from './useRefreshToken'
import { AuthActionType } from './actions'
import { Loader } from '@/ui'
import { useRouter } from 'next/navigation'
import { TOKEN_REMOVED_EVENT } from './authEvent'

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
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter()
  useRefreshToken()

  useEffect(() => {
    setLoading(true)

    const token = localStorage.getItem('token')

    if (!token) {
      router.push('/login')
      dispatch({ type: AuthActionType.LOGOUT })
    } else {
      console.log('login')

      dispatch({ type: AuthActionType.AUTHENTICATE, payload: token })
    }

    const handleTokenRemoved = () => {
      dispatch({ type: AuthActionType.LOGOUT })
    }

    window.addEventListener(TOKEN_REMOVED_EVENT, handleTokenRemoved)

    setLoading(false)

    return () => {
      window.removeEventListener(TOKEN_REMOVED_EVENT, handleTokenRemoved)
    }
  }, [dispatch])

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
