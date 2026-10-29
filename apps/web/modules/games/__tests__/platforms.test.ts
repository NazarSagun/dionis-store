import { describe, expect, it } from 'vitest'

import { platformLabels } from '../domain/platforms'

describe('platformLabels', () => {
  it('shortens the store platform names and keeps unknown ones', () => {
    expect(platformLabels('PC (Windows), PS5, Xbox Series X, Nintendo Switch')).toEqual(['PC', 'PS5', 'Xbox', 'Switch'])
    expect(platformLabels('PC (Windows), Web Browser')).toEqual(['PC', 'Web'])
    expect(platformLabels('Stadia')).toEqual(['Stadia'])
  })
})
