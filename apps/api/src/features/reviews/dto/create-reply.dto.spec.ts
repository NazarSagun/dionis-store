import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { CreateReplyDto } from './create-reply.dto'

const check = (input: object) => validate(plainToInstance(CreateReplyDto, input))

describe('CreateReplyDto', () => {
  it('accepts a text of 1 and of exactly 500 characters', async () => {
    await expect(check({ body: 'x' })).resolves.toHaveLength(0)
    await expect(check({ body: 'x'.repeat(500) })).resolves.toHaveLength(0)
  })

  it.each(['', '   ', 'x'.repeat(501), 12, null, undefined])('rejects the text %p', async (body) => {
    await expect(check({ body })).resolves.not.toHaveLength(0)
  })

  it('rejects a body that is missing', async () => {
    await expect(check({})).resolves.not.toHaveLength(0)
  })

  it('trims the text before it counts the length', async () => {
    const dto = plainToInstance(CreateReplyDto, { body: `  ${'x'.repeat(500)}  ` })

    await expect(validate(dto)).resolves.toHaveLength(0)
    expect(dto.body).toHaveLength(500)
  })
})
