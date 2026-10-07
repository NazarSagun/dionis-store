import { escapeHtml, formatEuros, ReceiptOrder, renderReceipt } from './receipt-template'

const baseOrder: ReceiptOrder = {
  id: 42,
  totalPrice: 12997,
  createdAt: new Date('2026-10-06T12:00:00Z'),
  shippingName: null,
  shippingLine1: null,
  shippingLine2: null,
  shippingCity: null,
  shippingPostalCode: null,
  shippingCountry: null,
  items: [],
}

const digitalItem = {
  quantity: 1,
  price: 1999,
  activationCode: 'AB12-CD34-EF56',
  game: { title: 'Nebula Runner', platform: 'PC' },
  edition: null,
}

const physicalItem = {
  quantity: 2,
  price: 7999,
  activationCode: null,
  game: { title: 'Ironclad Siege', platform: 'PS5' },
  edition: { name: 'Collector’s Physical Edition' },
}

describe('renderReceipt', () => {
  it('puts the order number in the subject and the euro total in both bodies', () => {
    const { subject, html, text } = renderReceipt({ ...baseOrder, items: [digitalItem] }, 'http://app.test/account')

    expect(subject).toBe('Your Dionis Store order #42')
    expect(html).toContain('€129.97')
    expect(text).toContain('Total paid: €129.97')
  })

  it('shows the activation code of a digital item in the HTML and the text', () => {
    const { html, text } = renderReceipt({ ...baseOrder, items: [digitalItem] }, 'http://app.test/account')

    expect(html).toContain('AB12-CD34-EF56')
    expect(text).toContain('ACTIVATION CODE: AB12-CD34-EF56')
  })

  it('shows the shipping address and no code for a physical item', () => {
    const order = {
      ...baseOrder,
      shippingName: 'Alex Doe',
      shippingLine1: 'Unter den Linden 1',
      shippingPostalCode: '10115',
      shippingCity: 'Berlin',
      shippingCountry: 'Germany',
      items: [physicalItem],
    }
    const { html, text } = renderReceipt(order, 'http://app.test/account')

    expect(text).toContain('SHIPS TO:\nAlex Doe\nUnter den Linden 1\n10115 Berlin\nGermany')
    expect(text).not.toContain('ACTIVATION CODE')
    expect(html).toContain('Ironclad Siege — Collector’s Physical Edition')
    expect(html).toContain('€159.98')
  })

  it('links the button to the account URL', () => {
    const { html } = renderReceipt({ ...baseOrder, items: [digitalItem] }, 'http://app.test/account')

    expect(html).toContain('href="http://app.test/account"')
    expect(html).toContain('View your order')
  })

  it('escapes values from the database', () => {
    const item = { ...digitalItem, game: { title: '<script>alert(1)</script>', platform: 'PC' } }
    const { html } = renderReceipt({ ...baseOrder, items: [item] }, 'http://app.test/account')

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  })
})

describe('escapeHtml and formatEuros', () => {
  it('escapes the five HTML special characters', () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;')
  })

  it('formats whole cents as euros with two decimals', () => {
    expect(formatEuros(5)).toBe('€0.05')
    expect(formatEuros(1999)).toBe('€19.99')
  })
})
