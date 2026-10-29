import { describe, expect, it } from 'vitest'

import { parseSectionBody } from '../domain/section-body'

describe('parseSectionBody', () => {
  it('splits paragraphs on a blank line and joins wrapped lines', () => {
    expect(parseSectionBody('First line\nstill first.\n\nSecond.')).toEqual([
      { type: 'paragraph', text: 'First line still first.' },
      { type: 'paragraph', text: 'Second.' },
    ])
  })

  it('groups lines that start with "- " into one list, next to a paragraph', () => {
    expect(parseSectionBody('Intro.\n- One\n- Two\n\n- Three')).toEqual([
      { type: 'paragraph', text: 'Intro.' },
      { type: 'list', items: ['One', 'Two'] },
      { type: 'list', items: ['Three'] },
    ])
  })

  it('keeps markup as text and ignores empty input', () => {
    expect(parseSectionBody('<b>hi</b>')).toEqual([{ type: 'paragraph', text: '<b>hi</b>' }])
    expect(parseSectionBody(' \n\n ')).toEqual([])
  })
})
