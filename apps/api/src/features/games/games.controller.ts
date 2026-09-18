import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { RequireRole } from '../../common/decorators/roles.decorator'
import { Roles } from '../../common/types/roles'
import { CustomError } from '../../common/errors/custom-error'
import { toHttpException } from '../../common/errors/to-http-exception'
import { GamesService } from './games.service'
import { CreateGameDto } from './dto/create-game.dto'
import { GamesQueryDto } from './dto/games-query.dto'

@Controller()
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('games/:page')
  async getGames(@Param('page') pageParam: string, @Query() query: GamesQueryDto) {
    const page = parseInt(pageParam, 10)
    if (isNaN(page) || page <= 0) {
      throw toHttpException(new CustomError('Invalid page number supplied', 400))
    }

    try {
      return await this.gamesService.fetchGames({ page, ...query })
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Get('game/:gameId')
  async getGame(@Param('gameId') gameIdParam: string) {
    if (!gameIdParam || !Number(gameIdParam)) {
      throw toHttpException(new CustomError('Invalid game id or type supplied', 400))
    }

    try {
      return await this.gamesService.fetchGameById({ gameId: Number(gameIdParam) })
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Post('games')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole(Roles.Admin)
  async createGame(@Body() dto: CreateGameDto) {
    try {
      return await this.gamesService.createGame(dto)
    } catch (error) {
      throw toHttpException(error)
    }
  }
}
