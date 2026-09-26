// The admin frames use Inter Semi Bold 14 in normal case for buttons, while
// the shared Button defaults to the storefront's uppercase display face.
export const adminButtonText = 'font-sans text-sm font-semibold normal-case tracking-normal'

export const adminPanel = 'rounded-[10px] border border-border bg-card'

export const adminLabel = 'font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground'

export const adminInput =
  'h-10 w-full rounded-md border border-border bg-panel-alt px-3 font-sans text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

// Pulls the API's message out of an Orval/axios error, the same shape
// toHttpException sends: { message: string }.
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  return typeof message === 'string' && message ? message : fallback
}
