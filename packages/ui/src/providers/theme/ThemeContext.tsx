'use client'

import { createContext, Dispatch, ReactNode, useContext, useReducer } from 'react'

import { ThemeAction } from './themeActions'
import { Theme, themeInitialState, themeReducer, ThemeState } from './themeReducer'

interface ThemeInitialState {
  state: ThemeState
  dispatch: Dispatch<ThemeAction>
}

type ThemeStateProviderProps = {
  children: ReactNode
  mode?: Theme
}

export const ThemeStateContext = createContext<ThemeInitialState | undefined>(undefined)
ThemeStateContext.displayName = 'ThemeStateContext'

export const ThemeStateProvider = ({ children, mode }: ThemeStateProviderProps) => {
  const [state, dispatch] = useReducer(themeReducer, themeInitialState || { mode })

  return <ThemeStateContext.Provider value={{ state, dispatch }}>{children}</ThemeStateContext.Provider>
}

export const useThemeState = () => {
  const context = useContext(ThemeStateContext)
  if (!context) {
    throw new Error('useThemeState must be used within a ThemeStateProvider')
  }
  return context
}
