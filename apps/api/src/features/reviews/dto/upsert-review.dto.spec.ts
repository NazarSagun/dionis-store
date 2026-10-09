import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { UpsertReviewDto } from './upsert-review.dto'

const check = (input: object) => validate(plainToInstance(UpsertReviewDto, input))

describe('UpsertReviewDto', () => {
  it.each([1, 3, 5])('accepts rating %i', async (rating) => {
    await expect(check({ rating })).resolves.toHaveLength(0)
  })

  it.each([0, 6, 3.5, -1, '4', null])('rejects rating %p', async (rating) => {
    await expect(check({ rating })).resolves.not.toHaveLength(0)
  })

  it('accepts a text of exactly 1000 characters and rejects 1001', async () => {
    await expect(check({ rating: 4, body: 'x'.repeat(1000) })).resolves.toHaveLength(0)
    await expect(check({ rating: 4, body: 'x'.repeat(1001) })).resolves.not.toHaveLength(0)
  })

  it('trims the text before it counts the length', async () => {
    const dto = plainToInstance(UpsertReviewDto, { rating: 4, body: `  ${'x'.repeat(1000)}  ` })

    await expect(validate(dto)).resolves.toHaveLength(0)
    expect(dto.body).toHaveLength(1000)
  })
})
