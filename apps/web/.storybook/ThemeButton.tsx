import React from 'react'
import { useGlobalState } from '../providers/store/GlobalStateContext'
import { ThemeActionType } from '../providers/store/actions'
import { ThemeIcon } from '../components/atoms/theme-icon'

export const ThemeButton = () => {
  const { dispatch } = useGlobalState()
  return (
    <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
      <ThemeIcon onClick={() => dispatch({ type: ThemeActionType.TOGGLE_THEME })} />
    </div>
  )
}
