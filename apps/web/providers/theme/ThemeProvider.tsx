'use client'

import { type FC, type ReactNode, useContext, useState } from 'react'

import { LOCAL_STORAGE_THEME_KEY, Theme, ThemeContext } from './ThemeContext'

export interface ChildrenProps {
  children: ReactNode
  mode?: Theme
}

const localStorageKey = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_THEME_KEY) : null

const ThemeState = (localStorageKey as Theme) || Theme.DARK

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Create the ThemeProvider component
export const ThemeProvider: FC<ChildrenProps> = ({ children, mode }) => {
  const [theme, setTheme] = useState<Theme>(mode || ThemeState)

  const toggleTheme = () => {
    setTheme((prevTheme: Theme) => {
      const currentTheme = prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, currentTheme)
      return currentTheme
    })
  }

  const themeValues = {
    theme,
    toggleTheme,
  }

  return <ThemeContext.Provider value={themeValues}>{children}</ThemeContext.Provider>
}
