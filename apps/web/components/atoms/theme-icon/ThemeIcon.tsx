import React from 'react'
import Image from 'next/image'

import { Theme, ThemeActionType } from '@/providers/theme'
import { useThemeState } from '@/providers/theme/ThemeContext'

import classes from './ThemeIcon.module.scss'

interface ThemeIconProps {
  onClick?: () => void
}

export const ThemeIcon = ({ onClick }: ThemeIconProps) => {
  const { state, dispatch } = useThemeState()
  const imagePath = '/icons'
  const mode = state.mode
  const isDarkMode = mode === Theme.DARK ? 'dark-theme.png' : 'light-theme.png'

  const changeBodyStyles = () => {
    const body = document.getElementById('body')
    if (mode === Theme.LIGHT && body) {
      body.classList.add('light')
    } else {
      body && body.classList.remove('light')
    }
  }

  return (
    <button
      className={classes.theme_icon}
      onClick={() => {
        onClick && onClick()
        changeBodyStyles()
        dispatch({ type: ThemeActionType.TOGGLE_THEME })
      }}
    >
      <Image
        src={`${imagePath}/${isDarkMode}`}
        alt={`${mode}-mode-icon`}
        width={32}
        height={32}
      />
    </button>
  )
}
