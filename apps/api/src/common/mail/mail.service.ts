import { Injectable, Logger } from '@nestjs/common'
import { createTransport, Transporter } from 'nodemailer'
import { ReceiptOrder, renderReceipt } from './receipt-template'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly transport: Transporter | null

  constructor() {
    const host = process.env.SMTP_HOST
    if (!host) {
      this.logger.warn('SMTP_HOST is not set. Order receipts are not sent.')
      this.transport = null
      return
    }

    const port = Number(process.env.SMTP_PORT) || 587
    const { SMTP_USER: user, SMTP_PASS: pass } = process.env
    this.transport = createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    })
  }

  // Returns false when mail is turned off, so the caller can tell "sent" from
  // "skipped". A failed send throws.
  async sendOrderReceipt(to: string, order: ReceiptOrder): Promise<boolean> {
    if (!this.transport) return false

    const { subject, html, text } = renderReceipt(order, this.getAccountUrl())
    await this.transport.sendMail({
      from: process.env.MAIL_FROM || 'Dionis Store <no-reply@dionis-store.local>',
      to,
      subject,
      html,
      text,
    })
    return true
  }

  // CLIENT_URL can list several origins. The first one is the main web app.
  private getAccountUrl(): string {
    const origin = (process.env.CLIENT_URL ?? '').split(',')[0].trim().replace(/\/$/, '')
    return `${origin}/account`
  }
}
