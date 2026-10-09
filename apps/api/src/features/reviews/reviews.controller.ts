import { Body, Controller, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common'
import { CustomError } from '../../common/errors/custom-error'
import { toHttpException } from '../../common/errors/to-http-exception'
import { AuthenticatedRequest, JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ReviewsQueryDto } from './dto/reviews-query.dto'
import { UpsertReviewDto } from './dto/upsert-review.dto'
import { ReviewsService } from './reviews.service'

function parseGameId(idParam: string) {
  const id = Number(idParam)
  if (!idParam || !Number.isInteger(id) || id <= 0) {
    throw toHttpException(new CustomError('Invalid game id or type supplied', 400))
  }
  return id
}

@Controller('games/:id')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('reviews')
  async list(@Param('id') idParam: string, @Query() query: ReviewsQueryDto) {
    const gameId = parseGameId(idParam)
    try {
      return await this.reviewsService.list(gameId, Number(query.page ?? 1))
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Get('review')
  @UseGuards(JwtAuthGuard)
  async getOwn(@Req() req: AuthenticatedRequest, @Param('id') idParam: string) {
    const gameId = parseGameId(idParam)
    try {
      return await this.reviewsService.getOwn(req.user.email, gameId)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Put('review')
  @UseGuards(JwtAuthGuard)
  async upsert(@Req() req: AuthenticatedRequest, @Param('id') idParam: string, @Body() dto: UpsertReviewDto) {
    const gameId = parseGameId(idParam)
    try {
      return await this.reviewsService.upsert(req.user.email, gameId, dto)
    } catch (error) {
      throw toHttpException(error)
    }
  }
}
