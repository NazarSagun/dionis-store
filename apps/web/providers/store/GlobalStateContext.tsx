import { createContext, Dispatch, ReactNode, useContext, useReducer } from 'react'

import { globalInitialState, GlobalState, rootReducer } from './reducers'
import { ActionType } from './types'

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

  return <GlobalStateContext.Provider value={{ state, dispatch }}>{children}</GlobalStateContext.Provider>
}

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext)
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider')
  }
  return context
}
