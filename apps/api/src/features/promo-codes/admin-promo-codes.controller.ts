import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common'
import { CustomError } from '../../common/errors/custom-error'
import { RequireRole } from '../../common/decorators/roles.decorator'
import { toHttpException } from '../../common/errors/to-http-exception'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/types/roles'
import { CreatePromoCodeDto } from './dto/create-promo-code.dto'
import { PromoCodesService } from './promo-codes.service'

@Controller('admin/promo-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRole(Roles.Admin)
export class AdminPromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Get()
  async list() {
    try {
      return await this.promoCodesService.list()
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Post()
  async create(@Body() dto: CreatePromoCodeDto) {
    try {
      return await this.promoCodesService.create(dto)
    } catch (error) {
      throw toHttpException(error)
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') idParam: string) {
    const id = Number(idParam)
    if (!idParam || !Number.isInteger(id)) {
      throw toHttpException(new CustomError('Invalid promo code id supplied', 400))
    }

    try {
      await this.promoCodesService.remove(id)
    } catch (error) {
      throw toHttpException(error)
    }
  }
}
