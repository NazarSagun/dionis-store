// Password reset email, see .claude/specs/password-reset-spec.md. It reuses the
// restock alert layout. Email clients load neither web fonts nor CSS variables,
// so the design tokens appear here as inline hex values.

import { escapeHtml } from './receipt-template'

const COLOR = {
  canvas: '#020617',
  border: '#334155',
  text: '#f8fafc',
  muted: '#94a3b8',
  cta: '#ef4444',
}
const HEADING_FONT = `'Space Grotesk', Arial, Helvetica, sans-serif`
const BODY_FONT = `Inter, Arial, Helvetica, sans-serif`

export function renderPasswordReset(resetUrl: string) {
  const subject = 'Reset your Dionis Store password'
  const muted = `font-family:${BODY_FONT};font-size:14px;line-height:20px;color:${COLOR.muted};`
  const url = escapeHtml(resetUrl)

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:${COLOR.canvas};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.canvas};"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${COLOR.canvas};">
  <tr><td style="padding:24px 20px;border-bottom:1px solid ${COLOR.border};font-family:${HEADING_FONT};font-size:20px;font-weight:700;letter-spacing:1px;color:${COLOR.text};">DIONIS</td></tr>
  <tr><td style="padding:40px 20px 24px;">
    <div style="font-family:${BODY_FONT};font-size:12px;font-weight:600;letter-spacing:1px;color:${COLOR.cta};">ACCOUNT RECOVERY</div>
    <div style="padding-top:12px;font-family:${HEADING_FONT};font-size:32px;line-height:40px;font-weight:700;color:${COLOR.text};">Reset your password</div>
    <div style="padding-top:12px;${muted}">Someone asked to reset the password of the Dionis Store account for this address. Select the button to set a new password.</div>
  </td></tr>
  <tr><td style="padding:0 20px 40px;">
    <a href="${url}" style="display:inline-block;padding:14px 24px;border-radius:4px;background:${COLOR.cta};font-family:${BODY_FONT};font-size:14px;font-weight:600;color:${COLOR.text};text-decoration:none;">Set a new password</a>
    <div style="padding-top:12px;${muted}">The link works once and expires in 1 hour.</div>
  </td></tr>
  <tr><td style="padding:24px 20px 32px;border-top:1px solid ${COLOR.border};font-family:${BODY_FONT};font-size:12px;line-height:18px;color:${COLOR.muted};">
    If you did not ask for this, ignore this email. Your password stays the same. Please do not reply to this email.<br>© Dionis Store
  </td></tr>
</table>
</td></tr></table>
</body></html>`

  const text = [
    'Someone asked to reset the password of the Dionis Store account for this address.',
    '',
    `Set a new password: ${resetUrl}`,
    '',
    'The link works once and expires in 1 hour. If you did not ask for this, ignore this email.',
  ].join('\n')

  return { subject, html, text }
}
