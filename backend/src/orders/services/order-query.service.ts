import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { orderNumberFromCode } from '../../common/api-enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  orderInclude,
  OrderRecord,
  OrderResponse,
  toOrderResponse,
} from '../helpers/order-response.mapper.js';

export interface PaginatedOrdersResponse {
  items: OrderResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

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

  async findAllPaginated(params: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedOrdersResponse> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.OrderWhereInput = {};
    if (params.status) {
      const apiStatus = params.status.toUpperCase() as OrderStatus;
      if (Object.values(OrderStatus).includes(apiStatus)) {
        where.status = apiStatus;
      }
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: orders.map(toOrderResponse),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async findMine(customerId: string): Promise<OrderResponse[]> {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrderResponse);
  }

  async findMinePaginated(
    customerId: string,
    params: { page?: number; limit?: number },
  ): Promise<PaginatedOrdersResponse> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.OrderWhereInput = { customerId };

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: orders.map(toOrderResponse),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
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
    let order: OrderRecord | null = null;

    if (number !== null) {
      order = await this.prisma.order.findUnique({
        where: { number },
        include: orderInclude,
      });
    } else {
      order = await this.prisma.order.findFirst({
        where: {
          OR: [{ id }, { payment: { txRef: id } }],
        },
        include: orderInclude,
      });
    }

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
