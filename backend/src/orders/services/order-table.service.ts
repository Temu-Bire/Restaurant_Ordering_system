import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderType, Prisma, TableStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AssignTableDto } from '../dto/assign-table.dto.js';
import {
  OPEN_ORDER_STATUSES,
} from '../helpers/order-items.helper.js';
import {
  orderInclude,
  OrderResponse,
  toOrderResponse,
} from '../helpers/order-response.mapper.js';
import { OrderQueryService } from './order-query.service.js';

@Injectable()
export class OrderTableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderQuery: OrderQueryService,
  ) {}

  async assignTable(id: string, dto: AssignTableDto): Promise<OrderResponse> {
    const order = await this.orderQuery.findRecord(id);
    if (order.type !== OrderType.DINE_IN) {
      throw new BadRequestException('Only dine-in orders can be assigned to a table');
    }
    if (!OPEN_ORDER_STATUSES.includes(order.status)) {
      throw new BadRequestException('This order can no longer be assigned');
    }

    return this.prisma.$transaction(async (tx) => {
      const table = await tx.restaurantTable.findUnique({
        where: { id: dto.tableId },
      });
      if (!table) throw new NotFoundException('Table not found');

      if (
        table.status !== TableStatus.FREE &&
        table.status !== TableStatus.AVAILABLE &&
        table.id !== order.tableId
      ) {
        throw new BadRequestException('That table is not available');
      }

      const previousTableId = order.tableId;

      const updated = await tx.order.update({
        where: { id: order.id },
        data: { tableId: table.id, tableLabel: table.name },
        include: orderInclude,
      });

      await tx.restaurantTable.update({
        where: { id: table.id },
        data: { status: TableStatus.OCCUPIED, activeOrderId: order.id },
      });

      if (previousTableId && previousTableId !== table.id) {
        await this.releaseTable(previousTableId, tx);
      }

      return toOrderResponse(updated);
    });
  }

  async releaseTable(tableId: string, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
    const stillOpen = await tx.order.count({
      where: { tableId, status: { in: OPEN_ORDER_STATUSES } },
    });
    if (stillOpen === 0) {
      await tx.restaurantTable.update({
        where: { id: tableId },
        data: { status: TableStatus.AVAILABLE, activeOrderId: null, heldUntil: null },
      });
    }
  }
}
