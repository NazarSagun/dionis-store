import React from 'react'
import Image from 'next/image'

import { Theme } from '@/providers/theme'
import { useThemeState } from '@/providers/theme/ThemeContext'

import classes from './ThemeIcon.module.scss'

interface ThemeIconProps {
  onClick?: () => void
}

export const ThemeIcon = ({ onClick }: ThemeIconProps) => {
  const { state } = useThemeState()
  const imagePath = '/icons'
  const mode = state.mode
  const isDarkModeIcon = mode === Theme.DARK ? 'light-theme.png' : 'dark-theme.png'
  const isDarkMode = mode === Theme.DARK ? Theme.LIGHT : Theme.DARK

  return (
    <button
      className={classes.theme_icon}
      onClick={() => onClick && onClick()}
      data-testid='theme-button'
    >
      <Image
        src={`${imagePath}/${isDarkModeIcon}`}
        alt={`switch-to-${mode}-mode-icon`}
        width={32}
        height={32}
        data-testid='theme-icon'
      />
    </button>
  )
}
