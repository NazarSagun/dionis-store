import { APIRequestContext, expect } from '@playwright/test'

// Reads receipts from Mailpit, the mail catcher the API sends to in dev and
// CI. See .claude/specs/email-receipts-spec.md.

const MAIL_API_URL = process.env.E2E_MAIL_API_URL || 'http://localhost:8025'

export interface ReceiptMessage {
  Subject: string
  HTML: string
  Text: string
}

// Each test signs up with its own address, so searching by recipient keeps
// parallel tests from reading each other's mail.
async function findMessageIds(request: APIRequestContext, to: string): Promise<string[]> {
  const response = await request.get(`${MAIL_API_URL}/api/v1/search`, { params: { query: `to:${to}` } })
  expect(response.ok()).toBeTruthy()
  const body = (await response.json()) as { messages: { ID: string }[] }
  return body.messages.map((message) => message.ID)
}

export async function waitForReceipts(request: APIRequestContext, to: string, count = 1): Promise<ReceiptMessage[]> {
  let ids: string[] = []
  await expect
    .poll(async () => (ids = await findMessageIds(request, to)).length, { timeout: 15_000 })
    .toBeGreaterThanOrEqual(count)

  return Promise.all(
    ids.map(async (id) => {
      const response = await request.get(`${MAIL_API_URL}/api/v1/message/${id}`)
      return (await response.json()) as ReceiptMessage
    }),
  )
}

// Used to prove that no second email arrives. Waits a fixed time, because the
// absence of a message has no event to wait for.
export async function countReceiptsAfterDelay(request: APIRequestContext, to: string, delayMs = 3_000) {
  await new Promise((resolve) => setTimeout(resolve, delayMs))
  return (await findMessageIds(request, to)).length
}
