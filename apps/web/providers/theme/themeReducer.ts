/* eslint-disable no-unused-vars */
import { ThemeAction, ThemeActionType } from './themeActions'

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export const LOCAL_STORAGE_THEME_KEY = 'theme'

export type ThemeState = {
  mode: Theme
}

const localStorageKeyHandler = () => {
  if (typeof window !== 'undefined') {
    if (!localStorage.getItem(LOCAL_STORAGE_THEME_KEY)) {
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, Theme.DARK)
    } else {
      localStorage.getItem(LOCAL_STORAGE_THEME_KEY)
    }
  }
  return null
}

export const themeInitialState: ThemeState = {
  mode: (localStorageKeyHandler() as Theme | null) || Theme.DARK,
}

export const themeReducer = (state: ThemeState, action: ThemeAction) => {
  switch (action.type) {
    case ThemeActionType.TOGGLE_THEME:
      return state.mode === Theme.LIGHT ? { ...state, mode: Theme.DARK } : { ...state, mode: Theme.LIGHT }
    default:
      return state
  }
}
