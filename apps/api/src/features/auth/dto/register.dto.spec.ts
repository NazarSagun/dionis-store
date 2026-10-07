import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { RegisterDto } from './register.dto'

const errorsFor = async (password: string) =>
  validate(plainToInstance(RegisterDto, { name: 'Player', email: 'player@dionis-store.test', password }))

describe('RegisterDto', () => {
  it('rejects a password shorter than 8 characters', async () => {
    expect(await errorsFor('short1')).toHaveLength(1)
  })

  it('rejects a password longer than 72 characters, which bcrypt would cut', async () => {
    expect(await errorsFor('a'.repeat(73))).toHaveLength(1)
  })

  it('accepts a password of 8 to 72 characters', async () => {
    expect(await errorsFor('password123')).toHaveLength(0)
  })
})
