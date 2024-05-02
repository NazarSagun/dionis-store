/* eslint-disable no-unused-vars */
import { ThemeAction, ThemeActionType } from './themeActions'

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export const LOCAL_STORAGE_THEME_KEY = 'theme'

const localStorageKey = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_THEME_KEY) : null

export type ThemeState = {
  mode: Theme
}

export const themeInitialState: ThemeState = {
  mode: (localStorageKey as Theme) || Theme.DARK,
}

export const themeReducer = (state: ThemeState, action: ThemeAction) => {
  switch (action.type) {
    case ThemeActionType.TOGGLE_THEME:
      return state.mode === Theme.LIGHT ? { ...state, mode: Theme.DARK } : { ...state, mode: Theme.LIGHT }
    default:
      return state
  }
}
