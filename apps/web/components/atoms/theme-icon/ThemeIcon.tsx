import React from 'react'
import Image from 'next/image'

import { Theme } from '@/providers/theme/ThemeContext'

import classes from './ThemeIcon.module.scss'

interface ThemeIconProps {
  theme?: Theme
  onClick?: () => void
}

export const ThemeIcon = ({ theme, onClick }: ThemeIconProps) => {
  const imagePath = '/icons'
  const isDarkMode = theme === 'dark' ? 'light-theme.png' : 'dark-theme.png'

  const changeBodyStyles = () => {
    const body = document.getElementById('body')
    if (theme === 'light' && body) {
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
      }}
    >
      <Image
        src={`${imagePath}/${isDarkMode}`}
        alt={`${theme}-mode-icon`}
        width={32}
        height={32}
      />
      Theme
    </button>
  )
}
