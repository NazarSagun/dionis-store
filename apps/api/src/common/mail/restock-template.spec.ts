import { renderRestockAlert } from './restock-template'

describe('renderRestockAlert', () => {
  const alert = { gameTitle: 'Nebula <Runner>', editionName: 'Collector', gameUrl: 'http://localhost:3000/game/3' }

  it('puts the game and edition in the subject and links the game in both bodies', () => {
    const { subject, html, text } = renderRestockAlert(alert)

    expect(subject).toBe('Nebula <Runner> (Collector) is back in stock')
    expect(html).toContain('href="http://localhost:3000/game/3"')
    expect(text).toContain('http://localhost:3000/game/3')
  })

  it('escapes the game title in the html', () => {
    expect(renderRestockAlert(alert).html).toContain('Nebula &lt;Runner&gt;')
  })
})
