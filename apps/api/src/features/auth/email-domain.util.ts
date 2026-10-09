import { promises as dns } from 'node:dns'
import MailChecker from 'mailchecker'

// Reserved TLDs never resolve, so the MX lookup skips them. Dev, seed and e2e emails use them.
const RESERVED_TLDS = ['test', 'local', 'invalid', 'example']

/** True for an address on a reserved TLD, such as player@dionis-store.test. */
export function hasReservedTld(email: string): boolean {
  const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase()
  return RESERVED_TLDS.includes(domain.slice(domain.lastIndexOf('.') + 1))
}

const NO_MAIL_CODES = ['ENOTFOUND', 'ENODATA']

/** False only when DNS says the domain has no mail server. A DNS outage fails open. */
export async function hasMailServer(email: string): Promise<boolean> {
  if (hasReservedTld(email)) return true
  const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase()

  try {
    return (await dns.resolveMx(domain)).length > 0
  } catch (error) {
    return !NO_MAIL_CODES.includes((error as { code?: string }).code ?? '')
  }
}

/** True for a throwaway email domain, such as mailinator.com. */
export const isDisposableEmail = (email: string) => !MailChecker.isValid(email)
