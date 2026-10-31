import { describe, expect, it } from 'vitest'

import { useShowdownPromptStore, useShowdownStore } from '../core/store'

describe('useShowdownPromptStore', () => {
  it('saves the seen flag in localStorage', () => {
    useShowdownPromptStore.getState().markSeen()
    expect(JSON.parse(localStorage.getItem('showdown-prompt-storage') ?? '{}').state).toEqual({ seen: true })
  })
})

describe('useShowdownStore', () => {
  it('selects at most 3 genres, and a second toggle clears one', () => {
    const { toggleGenre } = useShowdownStore.getState()
    for (const genre of ['A', 'B', 'C', 'D']) toggleGenre(genre)
    expect(useShowdownStore.getState().genres).toEqual(['A', 'B', 'C'])
    toggleGenre('B')
    expect(useShowdownStore.getState().genres).toEqual(['A', 'C'])
  })

  it('goes back to setup with the same genres and size', () => {
    const state = useShowdownStore.getState()
    state.toggleGenre('Shooter')
    state.setSize(8)
    state.begin([])
    state.pick(1)
    state.backToSetup()
    expect(useShowdownStore.getState()).toMatchObject({
      status: 'setup',
      genres: ['Shooter'],
      size: 8,
      picks: [],
    })
  })
})
