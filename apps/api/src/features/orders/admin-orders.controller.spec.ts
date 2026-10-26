import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { CustomError } from '../../common/errors/custom-error'
import { AdminOrdersController } from './admin-orders.controller'
import { UpdateOrderShipmentDto } from './dto/update-order-shipment.dto'
import { OrdersService } from './orders.service'

describe('AdminOrdersController', () => {
  const ordersService = { updateOrderShipment: jest.fn().mockResolvedValue({ id: 7 }) }
  const controller = new AdminOrdersController(ordersService as unknown as OrdersService)

  beforeEach(() => ordersService.updateOrderShipment.mockClear())

  it('passes a numeric order id and the body to the service', async () => {
    await controller.updateOrderShipment('7', { status: 'SHIPPED', trackingNumber: 'TRK123' })

    expect(ordersService.updateOrderShipment).toHaveBeenCalledWith(7, 'SHIPPED', 'TRK123')
  })

  it('rejects a non-numeric order id with 400', async () => {
    await expect(controller.updateOrderShipment('abc', { status: 'SHIPPED' })).rejects.toMatchObject({ status: 400 })
    expect(ordersService.updateOrderShipment).not.toHaveBeenCalled()
  })

  it('maps a service error through toHttpException', async () => {
    ordersService.updateOrderShipment.mockRejectedValueOnce(new CustomError('Order not found', 404))

    await expect(controller.updateOrderShipment('7', { status: 'SHIPPED' })).rejects.toMatchObject({ status: 404 })
  })
})

describe('UpdateOrderShipmentDto', () => {
  const errors = (body: object) => validate(plainToInstance(UpdateOrderShipmentDto, body))

  it('accepts each status with an optional tracking number', async () => {
    await expect(errors({ status: 'PENDING' })).resolves.toHaveLength(0)
    await expect(errors({ status: 'DELIVERED', trackingNumber: 'x'.repeat(64) })).resolves.toHaveLength(0)
  })

  it('rejects an unknown status and a tracking number over 64 characters', async () => {
    await expect(errors({ status: 'LOST' })).resolves.not.toHaveLength(0)
    await expect(errors({ status: 'SHIPPED', trackingNumber: 'x'.repeat(65) })).resolves.not.toHaveLength(0)
  })
})
