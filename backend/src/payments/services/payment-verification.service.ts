import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderType,
  PaymentStatus,
  TableStatus,
} from '@prisma/client';
import {
  orderNumberFromCode,
  toApiOrderStatus,
  toApiPaymentStatus,
} from '../../common/api-enums.js';
import { StockManagementService } from '../../inventory/services/stock-management.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaymentVerificationOutcome, VerifyPaymentDto } from '../dto/verify-payment.dto.js';
import {
  PaymentResponse,
  toPaymentResponse,
} from '../helpers/payment-response.mapper.js';
import { ReceiptService } from './receipt.service.js';

export interface VerifyPaymentResult {
  success: boolean;
  outcome: PaymentVerificationOutcome;
  orderStatus: string;
  paymentStatus: string;
  payment: PaymentResponse;
}

@Injectable()
export class PaymentVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockManagement: StockManagementService,
    private readonly receiptService: ReceiptService,
  ) {}

  async verify(
    paymentIdOrOrderId: string,
    dto: VerifyPaymentDto,
  ): Promise<VerifyPaymentResult> {
    const number = orderNumberFromCode(paymentIdOrOrderId);

    return this.prisma.$transaction(async (tx) => {
      // Fetch payment and associated order INSIDE the transaction to prevent race conditions
      const payment = await tx.payment.findFirst({
        where: {
          OR: [
            { id: paymentIdOrOrderId },
            { orderId: paymentIdOrOrderId },
            ...(number !== null ? [{ order: { number } }] : []),
          ],
        },
        include: {
          order: {
            include: {
              items: { include: { food: { include: { recipes: true } } } },
              table: true,
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment record not found');
      }

      const order = payment.order;
      const isSuccess = dto.outcome === PaymentVerificationOutcome.SUCCESS;

      // ── Idempotency & Terminal State Validation ──
      if (payment.status === PaymentStatus.PAID) {
        if (isSuccess) {
          // Idempotent return: already paid, do not re-deduct stock or re-allocate receipt
          return {
            success: true,
            outcome: dto.outcome,
            orderStatus: toApiOrderStatus(order.status),
            paymentStatus: toApiPaymentStatus(payment.status),
            payment: toPaymentResponse({
              ...payment,
              order: { number: order.number },
            }),
          };
        }

        // Prevent late/conflicting callbacks from failing a paid order
        throw new BadRequestException(
          'Payment has already been marked as PAID and cannot be changed to FAILED or EXPIRED.',
        );
      }

      // Handle duplicate non-success outcome idempotently
      if (
        (payment.status === PaymentStatus.FAILED && dto.outcome === PaymentVerificationOutcome.FAILED) ||
        (payment.status === PaymentStatus.EXPIRED && dto.outcome === PaymentVerificationOutcome.EXPIRED)
      ) {
        return {
          success: false,
          outcome: dto.outcome,
          orderStatus: toApiOrderStatus(order.status),
          paymentStatus: toApiPaymentStatus(payment.status),
          payment: toPaymentResponse({
            ...payment,
            order: { number: order.number },
          }),
        };
      }

      let receipt = payment.receipt;
      let targetPaymentStatus: PaymentStatus;
      let targetOrderStatus: OrderStatus;

      if (isSuccess) {
        // Concurrency-safe atomic receipt allocation
        if (!receipt) {
          receipt = await this.receiptService.nextReceipt(tx);
        }
        targetPaymentStatus = PaymentStatus.PAID;
        targetOrderStatus = OrderStatus.CONFIRMED;

        // Deduct inventory stock if not already deducted
        if (!order.stockAdjusted) {
          await this.stockManagement.adjustOrderStock(
            tx,
            order.items.map((item) => ({
              food: item.food,
              quantity: item.quantity,
            })),
            'deduct',
          );
        }

        // Confirm table reservation for dine-in orders
        if (order.type === OrderType.DINE_IN && order.tableId) {
          await tx.restaurantTable.update({
            where: { id: order.tableId },
            data: {
              status: TableStatus.OCCUPIED,
              activeOrderId: order.id,
              heldUntil: null,
            },
          });
        }
      } else {
        targetPaymentStatus =
          dto.outcome === PaymentVerificationOutcome.EXPIRED
            ? PaymentStatus.EXPIRED
            : PaymentStatus.FAILED;
        targetOrderStatus = OrderStatus.CANCELLED;

        // Release temporary table hold
        if (order.tableId) {
          await tx.restaurantTable.update({
            where: { id: order.tableId },
            data: {
              status: TableStatus.AVAILABLE,
              heldUntil: null,
              activeOrderId: null,
            },
          });
        }

        // Restore stock if it was previously deducted
        if (order.stockAdjusted) {
          await this.stockManagement.adjustOrderStock(
            tx,
            order.items.map((item) => ({
              food: item.food,
              quantity: item.quantity,
            })),
            'restore',
          );
        }
      }

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: targetPaymentStatus,
          paid: isSuccess,
          receipt,
          transactionId: dto.transactionRef || payment.transactionId,
          verifiedAt: isSuccess ? new Date() : null,
        },
        include: { order: { select: { number: true } } },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: targetOrderStatus,
          paymentStatus: targetPaymentStatus,
          stockAdjusted: isSuccess,
          heldUntil: null,
        },
      });

      return {
        success: isSuccess,
        outcome: dto.outcome,
        orderStatus: toApiOrderStatus(targetOrderStatus),
        paymentStatus: toApiPaymentStatus(targetPaymentStatus),
        payment: toPaymentResponse(updatedPayment),
      };
    });
  }
}
