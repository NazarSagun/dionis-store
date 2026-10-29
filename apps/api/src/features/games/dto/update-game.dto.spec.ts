import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { UpdateGameDto } from './update-game.dto'

const errorsFor = async (body: object) => validate(plainToInstance(UpdateGameDto, body))

describe('UpdateGameDto content fields', () => {
  it('accepts an 11-character trailer id, null, and known section kinds', async () => {
    await expect(errorsFor({ trailerYoutubeId: 'dQw4w9WgXcQ' })).resolves.toHaveLength(0)
    await expect(errorsFor({ trailerYoutubeId: null })).resolves.toHaveLength(0)
    await expect(
      errorsFor({ sections: [{ kind: 'features', title: 'Features', body: '- One', position: 0 }] }),
    ).resolves.toHaveLength(0)
  })

  it('rejects a trailer id of the wrong length or with other characters', async () => {
    await expect(errorsFor({ trailerYoutubeId: 'short' })).resolves.not.toHaveLength(0)
    await expect(errorsFor({ trailerYoutubeId: 'dQw4w9WgXc!' })).resolves.not.toHaveLength(0)
  })

  it('rejects a section kind that is not in the list, and an image without a url', async () => {
    await expect(
      errorsFor({ sections: [{ kind: 'requirements', title: 'Req', body: 'Text', position: 0 }] }),
    ).resolves.not.toHaveLength(0)
    await expect(errorsFor({ images: [{ alt: 'A', position: 0 }] })).resolves.not.toHaveLength(0)
  })

  it('accepts PEGI and ESRB labels, scores from 0 to 100, and languages', async () => {
    await expect(
      errorsFor({
        ageRatings: ['PEGI 12', 'ESRB T'],
        criticRating: 94,
        criticRatingCount: 17,
        languages: [{ language: 'French', audio: false, subtitles: true, interface: true }],
      }),
    ).resolves.toHaveLength(0)
  })

  it('rejects another rating board, a score above 100, and a language without its flags', async () => {
    await expect(errorsFor({ ageRatings: ['USK 12'] })).resolves.not.toHaveLength(0)
    await expect(errorsFor({ userRating: 101 })).resolves.not.toHaveLength(0)
    await expect(errorsFor({ languages: [{ language: 'French' }] })).resolves.not.toHaveLength(0)
  })
})
