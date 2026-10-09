import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { RequireRole } from '../../common/decorators/roles.decorator'
import { Roles } from '../../common/types/roles'
import { CustomError } from '../../common/errors/custom-error'
import { toHttpException } from '../../common/errors/to-http-exception'
import { GamesService } from './games.service'
import { CreateGameDto } from './dto/create-game.dto'
import { CreateEditionDto, UpdateEditionDto } from './dto/edition.dto'
import { GamesQueryDto } from './dto/games-query.dto'
import { UpdateGameDto } from './dto/update-game.dto'

@Controller()
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('games/top-deals')
  async getTopDeals() {
    try {
      return await this.gamesService.fetchTopDeals()
    } catch (error) {
      throw toHttpException(error)
    }
  }

  // Declared before games/:page, so "genres" is not read as a page number.
  @Get('games/genres')
  async getGenres() {
    try {
      return await this.gamesService.fetchGenres()
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Get('games/:page')
  async getGames(@Param('page') pageParam: string, @Query() query: GamesQueryDto) {
    const page = parseInt(pageParam, 10)
    if (isNaN(page) || page <= 0) {
      throw toHttpException(new CustomError('Invalid page number supplied', 400))
    }

    try {
      return await this.gamesService.fetchGames({
        page,
        ...query,
        minPrice: query.minPrice === undefined ? undefined : Number(query.minPrice),
        maxPrice: query.maxPrice === undefined ? undefined : Number(query.maxPrice),
      })
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
      return await this.gamesService.fetchGameDetail({ gameId: Number(gameIdParam) })
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

  @Patch('games/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole(Roles.Admin)
  async updateGame(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGameDto) {
    try {
      return await this.gamesService.updateGame(id, dto)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Delete('games/:id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole(Roles.Admin)
  async deleteGame(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.gamesService.deleteGame(id)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Post('games/:id/editions')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole(Roles.Admin)
  async createEdition(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateEditionDto) {
    try {
      return await this.gamesService.createEdition(id, dto)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Patch('editions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole(Roles.Admin)
  async updateEdition(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEditionDto) {
    try {
      return await this.gamesService.updateEdition(id, dto)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Delete('editions/:id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole(Roles.Admin)
  async deleteEdition(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.gamesService.deleteEdition(id)
    } catch (error) {
      throw toHttpException(error)
    }
  }
}
