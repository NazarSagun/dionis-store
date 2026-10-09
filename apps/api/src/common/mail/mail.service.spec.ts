import { createTransport } from 'nodemailer'
import { MailService } from './mail.service'
import { ReceiptOrder } from './receipt-template'

jest.mock('nodemailer')

const order: ReceiptOrder = {
  id: 1,
  totalPrice: 1999,
  createdAt: new Date('2026-10-06T12:00:00Z'),
  shippingName: null,
  shippingLine1: null,
  shippingLine2: null,
  shippingCity: null,
  shippingPostalCode: null,
  shippingCountry: null,
  items: [
    {
      quantity: 1,
      price: 1999,
      activationCode: 'AB12-CD34-EF56',
      game: { title: 'Nebula Runner', platform: 'PC' },
      edition: null,
    },
  ],
}

describe('MailService', () => {
  const originalEnv = process.env
  const sendMail = jest.fn()

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.SMTP_HOST
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS
    process.env.CLIENT_URL = 'http://localhost:3000, http://other.test'
    sendMail.mockReset().mockResolvedValue({})
    ;(createTransport as jest.Mock).mockReset().mockReturnValue({ sendMail })
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('starts and sends nothing when SMTP_HOST is empty', async () => {
    const service = new MailService()

    await expect(service.sendOrderReceipt('a@b.test', order)).resolves.toBe(false)
    expect(createTransport).not.toHaveBeenCalled()
  })

  it('sends a receipt with both bodies to the customer', async () => {
    process.env.SMTP_HOST = 'localhost'
    process.env.SMTP_PORT = '1025'
    process.env.MAIL_FROM = 'Shop <shop@test>'
    const service = new MailService()

    await expect(service.sendOrderReceipt('a@b.test', order)).resolves.toBe(true)

    expect(createTransport).toHaveBeenCalledWith({ host: 'localhost', port: 1025, secure: false, auth: undefined })
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Shop <shop@test>',
        to: 'a@b.test',
        subject: 'Your Dionis Store order #1',
        html: expect.stringContaining('href="http://localhost:3000/account"'),
        text: expect.stringContaining('AB12-CD34-EF56'),
      }),
    )
  })

  it('skips a reserved test domain on a real SMTP server', async () => {
    process.env.SMTP_HOST = 'smtp.sendgrid.net'
    const service = new MailService()

    await expect(service.sendOrderReceipt('a@dionis-store.test', order)).resolves.toBe(false)
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('sends a normal address on a real SMTP server', async () => {
    process.env.SMTP_HOST = 'smtp.sendgrid.net'
    const service = new MailService()

    await expect(service.sendOrderReceipt('a@gmail.com', order)).resolves.toBe(true)
  })

  it('logs in only when SMTP_USER is set', () => {
    process.env.SMTP_HOST = 'smtp.test'
    process.env.SMTP_USER = 'user'
    process.env.SMTP_PASS = 'pass'
    new MailService()

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ auth: { user: 'user', pass: 'pass' } }))
  })

  it('lets a send failure reach the caller', async () => {
    process.env.SMTP_HOST = 'localhost'
    sendMail.mockRejectedValue(new Error('connection refused'))
    const service = new MailService()

    await expect(service.sendOrderReceipt('a@b.test', order)).rejects.toThrow('connection refused')
  })
})
