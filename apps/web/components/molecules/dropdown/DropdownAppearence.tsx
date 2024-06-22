'use client'

import * as React from 'react'

import { Button } from '@/components/atoms'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './Dropdown'
import { Theme, ThemeActionType, useThemeState } from '@/providers/theme'

export function DropdownAppearence() {
  const { state, dispatch } = useThemeState()
  const [theme, setTheme] = React.useState(state.mode)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='default'>{theme}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value: Theme) => {
            setTheme(value)
            localStorage.setItem('theme', value)
            dispatch({ type: ThemeActionType.TOGGLE_THEME, payload: value })
          }}
        >
          <DropdownMenuRadioItem value={Theme.DARK}>Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={Theme.LIGHT}>Light</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
