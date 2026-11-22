import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { StockManagementService } from '../../inventory/services/stock-management.service.js';
import { AssignTableDto } from '../dto/assign-table.dto.js';
import { CreateOrderDto } from '../dto/create-order.dto.js';
import { HandoverOrderDto } from '../dto/handover-order.dto.js';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto.js';
import { OrderResponse } from '../helpers/order-response.mapper.js';
import { OrderCheckoutService } from './order-checkout.service.js';
import { OrderLifecycleService } from './order-lifecycle.service.js';
import { OrderQueryService } from './order-query.service.js';
import { OrderTableService } from './order-table.service.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderQuery: OrderQueryService,
    private readonly orderCheckout: OrderCheckoutService,
    private readonly orderLifecycle: OrderLifecycleService,
    private readonly orderTable: OrderTableService,
    private readonly stockManagement: StockManagementService,
  ) {}

  async findAll(): Promise<OrderResponse[]> {
    return this.orderQuery.findAll();
  }

  async findMine(customerId: string): Promise<OrderResponse[]> {
    return this.orderQuery.findMine(customerId);
  }

  async findOne(id: string, actor: { id: string; role: Role }): Promise<OrderResponse> {
    return this.orderQuery.findOne(id, actor);
  }

  async create(customerId: string, dto: CreateOrderDto): Promise<OrderResponse> {
    return this.orderCheckout.create(customerId, dto);
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    actor: { id: string; role: Role },
  ): Promise<OrderResponse> {
    return this.orderLifecycle.updateStatus(id, dto, actor);
  }

  async handover(
    id: string,
    actor: { id: string; role: Role },
    dto: HandoverOrderDto,
  ): Promise<OrderResponse> {
    return this.orderLifecycle.handover(id, actor, dto);
  }

  async cancel(id: string, customerId: string): Promise<OrderResponse> {
    return this.orderLifecycle.cancel(id, customerId);
  }

  async assignTable(id: string, dto: AssignTableDto): Promise<OrderResponse> {
    return this.orderTable.assignTable(id, dto);
  }

  /**
   * Backward-compatible stock adjustment method delegating to StockManagementService.
   */
  async adjustOrderStock(
    tx: Prisma.TransactionClient,
    lines: { food: { name: string; recipes: { ingredientId: string; quantity: Prisma.Decimal }[] }; quantity: number }[],
    direction: 'deduct' | 'restore',
  ) {
    return this.stockManagement.adjustOrderStock(tx, lines, direction);
  }
}
