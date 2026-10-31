import { getGamesShowdown } from '@repo/dionis-api/src/dionis/default/default'
import type { GetGamesShowdownParams } from '@repo/dionis-api/src/model'

export { useGetGamesGenres } from '@repo/dionis-api/src/dionis/default/default'
export type { GameObject, GenreCount } from '@repo/dionis-api/src/model'

// The API reads repeated keys (`genres=A&genres=B`), not axios's default `genres[]=A`.
export const fetchShowdownGames = (params: GetGamesShowdownParams) =>
  getGamesShowdown(params, { paramsSerializer: { indexes: null } })
