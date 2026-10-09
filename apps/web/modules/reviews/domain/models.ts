import { OwnedItem } from '@/modules/games/integration/repository'

export const REVIEW_MAX_LENGTH = 1000
export const STAR_COUNT = 5

export const starsLabel = (rating: number) => `${rating} out of ${STAR_COUNT} stars`

export const formatAverageRating = (average: number) => average.toFixed(1)

export const formatReviewCount = (count: number) => `${count} ${count === 1 ? 'review' : 'reviews'}`

// The API sends an ISO timestamp. UTC keeps the date the same on every machine.
export const formatReviewDate = (isoDate: string) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(isoDate))

// A review needs a purchase in any form: the digital copy or any edition.
export const ownsGame = (owned: OwnedItem[] | undefined, gameId: number) =>
  owned?.some((item) => item.gameId === gameId) ?? false

export const REPLY_MAX_LENGTH = 500
export const REPLIES_PAGE_SIZE = 10

export const formatRepliesToggle = (count: number) => (count > 0 ? `Replies (${count})` : 'Reply')

// The page that holds the newest reply, once one more reply is added.
export const pageOfNextReply = (replyCount: number) => Math.ceil((replyCount + 1) / REPLIES_PAGE_SIZE)

// The value of ?review= in the page URL. Anything but a positive whole number is ignored.
export const parseReviewParam = (raw: string | null | undefined): number | null => {
  if (!raw || !/^[1-9]\d{0,9}$/.test(raw)) return null
  return Number(raw)
}
