import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common'
import { CustomError } from '../../common/errors/custom-error'
import { toHttpException } from '../../common/errors/to-http-exception'
import { AuthenticatedRequest, JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CreateReplyDto } from './dto/create-reply.dto'
import { ReviewsQueryDto } from './dto/reviews-query.dto'
import { ReviewsService } from './reviews.service'

function parseReviewId(idParam: string) {
  const id = Number(idParam)
  if (!idParam || !Number.isInteger(id) || id <= 0) {
    throw toHttpException(new CustomError('Invalid review id or type supplied', 400))
  }
  return id
}

@Controller('reviews/:id')
export class ReviewRepliesController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async getOne(@Param('id') idParam: string) {
    const reviewId = parseReviewId(idParam)
    try {
      return await this.reviewsService.getById(reviewId)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Get('replies')
  async list(@Param('id') idParam: string, @Query() query: ReviewsQueryDto) {
    const reviewId = parseReviewId(idParam)
    try {
      return await this.reviewsService.listReplies(reviewId, Number(query.page ?? 1))
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Post('replies')
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: AuthenticatedRequest, @Param('id') idParam: string, @Body() dto: CreateReplyDto) {
    const reviewId = parseReviewId(idParam)
    try {
      return await this.reviewsService.createReply(req.user.email, reviewId, dto)
    } catch (error) {
      throw toHttpException(error)
    }
  }
}
