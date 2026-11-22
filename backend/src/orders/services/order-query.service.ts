import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { orderNumberFromCode } from '../../common/api-enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  orderInclude,
  OrderRecord,
  OrderResponse,
  toOrderResponse,
} from '../helpers/order-response.mapper.js';

@Injectable()
export class OrderQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<OrderResponse[]> {
    const orders = await this.prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrderResponse);
  }

  async findMine(customerId: string): Promise<OrderResponse[]> {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrderResponse);
  }

  async findOne(id: string, actor: { id: string; role: Role }): Promise<OrderResponse> {
    const order = await this.findRecord(id);
    if (actor.role === Role.CUSTOMER && order.customerId !== actor.id) {
      throw new ForbiddenException('You can only view your own orders');
    }
    return toOrderResponse(order);
  }

  async findRecord(id: string): Promise<OrderRecord> {
    const number = orderNumberFromCode(id);
    const order = await this.prisma.order.findUnique({
      where: number === null ? { id } : { number },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
