// Order receipt email. The design is in Figma, see
// .claude/specs/email-receipts-spec.md. Email clients load neither web fonts
// nor CSS variables, so the design tokens appear here as inline hex values.

export interface ReceiptItem {
  quantity: number
  price: number
  activationCode: string | null
  game: { title: string; platform: string }
  edition: { name: string } | null
}

export interface ReceiptOrder {
  id: number
  totalPrice: number
  createdAt: Date
  shippingName: string | null
  shippingLine1: string | null
  shippingLine2: string | null
  shippingCity: string | null
  shippingPostalCode: string | null
  shippingCountry: string | null
  items: ReceiptItem[]
}

const COLOR = {
  canvas: '#020617',
  surface: '#0e1223',
  alt: '#1a1e2f',
  border: '#334155',
  text: '#f8fafc',
  muted: '#94a3b8',
  cta: '#ef4444',
}
const HEADING_FONT = `'Space Grotesk', Arial, Helvetica, sans-serif`
const BODY_FONT = `Inter, Arial, Helvetica, sans-serif`
const MONO_FONT = `'JetBrains Mono', Consolas, Menlo, monospace`

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

export function formatEuros(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`
}

function shippingLines(order: ReceiptOrder): string[] {
  const cityLine = [order.shippingPostalCode, order.shippingCity].filter(Boolean).join(' ')
  return [order.shippingName, order.shippingLine1, order.shippingLine2, cityLine, order.shippingCountry].filter(
    (line): line is string => Boolean(line),
  )
}

function itemTitle(item: ReceiptItem): string {
  return item.edition ? `${item.game.title} — ${item.edition.name}` : item.game.title
}

function itemRowHtml(item: ReceiptItem, address: string[], isFirst: boolean): string {
  const detail = item.edition ? `Qty ${item.quantity}` : `${item.game.platform} · Qty ${item.quantity}`
  const label = `font-family:${BODY_FONT};font-size:12px;color:${COLOR.muted};`

  let extra = ''
  if (item.activationCode) {
    extra = `<div style="${label}padding-top:8px;">ACTIVATION CODE</div>
      <div style="display:inline-block;margin-top:6px;padding:8px 12px;border:1px solid ${COLOR.border};border-radius:4px;background:${COLOR.alt};font-family:${MONO_FONT};font-size:14px;color:${COLOR.text};">${escapeHtml(item.activationCode)}</div>`
  } else if (address.length > 0) {
    extra = `<div style="${label}padding-top:8px;">SHIPS TO</div>
      <div style="font-family:${BODY_FONT};font-size:14px;line-height:20px;color:${COLOR.text};">${address.map(escapeHtml).join('<br>')}</div>`
  }

  return `<tr><td style="padding:16px;${isFirst ? '' : `border-top:1px solid ${COLOR.border};`}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:${BODY_FONT};font-size:14px;line-height:20px;color:${COLOR.text};">
        <div style="font-weight:600;">${escapeHtml(itemTitle(item))}</div>
        <div style="color:${COLOR.muted};">${escapeHtml(detail)}</div>
        ${extra}
      </td>
      <td align="right" valign="top" style="padding-left:12px;font-family:${BODY_FONT};font-size:14px;font-weight:600;color:${COLOR.text};white-space:nowrap;">${formatEuros(item.price * item.quantity)}</td>
    </tr></table>
  </td></tr>`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function renderReceipt(order: ReceiptOrder, accountUrl: string) {
  const subject = `Your Dionis Store order #${order.id}`
  const address = shippingLines(order)
  const date = formatDate(order.createdAt)
  const muted = `font-family:${BODY_FONT};font-size:14px;line-height:20px;color:${COLOR.muted};`

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLOR.canvas};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.canvas};"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${COLOR.canvas};">
  <tr><td style="padding:24px 20px;border-bottom:1px solid ${COLOR.border};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:${HEADING_FONT};font-size:20px;font-weight:700;letter-spacing:1px;color:${COLOR.text};">DIONIS</td>
      <td align="right" style="font-family:${MONO_FONT};font-size:14px;color:${COLOR.muted};">ORDER #${order.id}</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:40px 20px 24px;">
    <div style="font-family:${BODY_FONT};font-size:12px;font-weight:600;letter-spacing:1px;color:${COLOR.cta};">ORDER CONFIRMED</div>
    <div style="padding-top:12px;font-family:${HEADING_FONT};font-size:32px;line-height:40px;font-weight:700;color:${COLOR.text};">Thanks for your order</div>
    <div style="padding-top:12px;${muted}">Placed on ${date}. Your payment was received.</div>
  </td></tr>
  <tr><td style="padding:0 20px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.surface};border:1px solid ${COLOR.border};">
      ${order.items.map((item, index) => itemRowHtml(item, address, index === 0)).join('\n      ')}
    </table>
  </td></tr>
  <tr><td style="padding:0 20px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:${BODY_FONT};font-size:14px;font-weight:600;color:${COLOR.muted};">Total paid</td>
      <td align="right" style="font-family:${HEADING_FONT};font-size:24px;font-weight:500;color:${COLOR.text};">${formatEuros(order.totalPrice)}</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:0 20px 40px;">
    <a href="${escapeHtml(accountUrl)}" style="display:inline-block;padding:14px 24px;border-radius:4px;background:${COLOR.cta};font-family:${BODY_FONT};font-size:14px;font-weight:600;color:${COLOR.text};text-decoration:none;">View your order</a>
    <div style="padding-top:12px;${muted}">Mark each code as activated in your account after you redeem it. Physical items ship separately.</div>
  </td></tr>
  <tr><td style="padding:24px 20px 32px;border-top:1px solid ${COLOR.border};font-family:${BODY_FONT};font-size:12px;line-height:18px;color:${COLOR.muted};">
    This is an automated receipt for your Dionis Store order. Please do not reply to this email.<br>© Dionis Store
  </td></tr>
</table>
</td></tr></table>
</body></html>`

  const lines = [`Thanks for your order. Order #${order.id}, placed on ${date}.`, '']
  for (const item of order.items) {
    lines.push(`${itemTitle(item)} (Qty ${item.quantity}): ${formatEuros(item.price * item.quantity)}`)
    if (item.activationCode) lines.push(`  ACTIVATION CODE: ${item.activationCode}`)
  }
  if (address.length > 0) lines.push('', 'SHIPS TO:', ...address)
  lines.push(
    '',
    `Total paid: ${formatEuros(order.totalPrice)}`,
    '',
    `View your order: ${accountUrl}`,
    'Mark each code as activated in your account after you redeem it. Physical items ship separately.',
  )

  return { subject, html, text: lines.join('\n') }
}
