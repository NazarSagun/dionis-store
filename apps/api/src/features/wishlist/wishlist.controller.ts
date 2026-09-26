import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common'
import { AuthenticatedRequest, JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { toHttpException } from '../../common/errors/to-http-exception'
import { MergeWishlistDto } from './dto/merge-wishlist.dto'
import { WishlistService } from './wishlist.service'

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async list(@Req() req: AuthenticatedRequest) {
    try {
      return await this.wishlistService.list(req.user.email)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Post('merge')
  async merge(@Req() req: AuthenticatedRequest, @Body() dto: MergeWishlistDto) {
    try {
      return await this.wishlistService.merge(req.user.email, dto.items)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Put(':gameId')
  async add(@Req() req: AuthenticatedRequest, @Param('gameId', ParseIntPipe) gameId: number) {
    try {
      return await this.wishlistService.add(req.user.email, gameId)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Delete(':gameId')
  async remove(@Req() req: AuthenticatedRequest, @Param('gameId', ParseIntPipe) gameId: number) {
    try {
      return await this.wishlistService.remove(req.user.email, gameId)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Patch(':gameId')
  async acknowledgeDiscount(@Req() req: AuthenticatedRequest, @Param('gameId', ParseIntPipe) gameId: number) {
    try {
      return await this.wishlistService.acknowledgeDiscount(req.user.email, gameId)
    } catch (error) {
      throw toHttpException(error)
    }
  }
}
