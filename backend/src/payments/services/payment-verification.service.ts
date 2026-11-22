import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  NotificationType,
  OrderStatus,
  OrderType,
  PaymentStatus,
  Role,
  TableStatus,
} from '@prisma/client';
import {
  orderNumberFromCode,
  toApiOrderStatus,
  toApiPaymentStatus,
} from '../../common/api-enums.js';
import { StockManagementService } from '../../inventory/services/stock-management.service.js';
import { NotificationService } from '../../notifications/notifications.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaymentVerificationOutcome, VerifyPaymentDto } from '../dto/verify-payment.dto.js';
import { ChapaGateway } from '../gateways/chapa.gateway.js';
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
  private readonly logger = new Logger(PaymentVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockManagement: StockManagementService,
    private readonly receiptService: ReceiptService,
    @Optional() private readonly chapa?: ChapaGateway,
    @Optional() private readonly notifications?: NotificationService,
  ) {}

  async verify(
    paymentIdOrOrderId: string,
    dto: VerifyPaymentDto,
  ): Promise<VerifyPaymentResult> {
    const number = orderNumberFromCode(paymentIdOrOrderId);

    const notificationTasks: (() => Promise<unknown>)[] = [];

    const result = await this.prisma.$transaction(async (tx) => {
      // Fetch payment and associated order INSIDE the transaction to prevent race conditions
      const payment = await tx.payment.findFirst({
        where: {
          OR: [
            { id: paymentIdOrOrderId },
            { orderId: paymentIdOrOrderId },
            { txRef: paymentIdOrOrderId },
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
      let outcome = dto.outcome;

      // Server-side verification with Chapa API if provider is Chapa
      const txRef = dto.transactionRef || payment.txRef;
      if (
        this.chapa &&
        payment.provider?.toLowerCase() === 'chapa' &&
        txRef &&
        payment.status !== PaymentStatus.PAID
      ) {
        try {
          const chapaRes = await this.chapa.verify(txRef);
          if (chapaRes.data) {
            if (chapaRes.data.currency && chapaRes.data.currency.toUpperCase() !== 'ETB') {
              this.logger.warn(`Currency mismatch: expected ETB, received ${chapaRes.data.currency}`);
              throw new BadRequestException('Invalid payment currency');
            }

            if (chapaRes.data.amount) {
              const paidAmount = Number(chapaRes.data.amount);
              const expectedAmount = payment.amount.toNumber();
              if (paidAmount > 0 && Math.abs(paidAmount - expectedAmount) > 0.01) {
                this.logger.warn(
                  `Amount mismatch for ${txRef}: expected ${expectedAmount}, received ${paidAmount}`,
                );
                throw new BadRequestException('Payment amount does not match order total');
              }
            }

            if (chapaRes.status === 'success' && chapaRes.data.status?.toLowerCase() === 'success') {
              outcome = PaymentVerificationOutcome.SUCCESS;
            } else if (chapaRes.data.status?.toLowerCase() === 'failed') {
              outcome = PaymentVerificationOutcome.FAILED;
            }
          }
        } catch (err) {
          if (err instanceof BadRequestException) throw err;
          if (this.chapa.getEnvironment() === 'TEST') {
            this.logger.log(`Chapa TEST environment: proceeding with outcome ${outcome}`);
          } else {
            this.logger.error(`Chapa gateway check returned error in LIVE mode: ${String(err)}`);
            throw new BadRequestException('Payment gateway verification failed');
          }
        }
      }

      const isSuccess = outcome === PaymentVerificationOutcome.SUCCESS;

      // ── Idempotency & Terminal State Validation ──
      if (payment.status === PaymentStatus.PAID) {
        if (isSuccess) {
          return {
            success: true,
            outcome,
            orderStatus: toApiOrderStatus(order.status),
            paymentStatus: toApiPaymentStatus(payment.status),
            payment: toPaymentResponse({
              ...payment,
              order: { number: order.number },
            }),
          };
        }

        throw new BadRequestException(
          'Payment has already been marked as PAID and cannot be changed to FAILED or EXPIRED.',
        );
      }

      // Duplicate non-success outcome idempotency
      if (
        (payment.status === PaymentStatus.FAILED && outcome === PaymentVerificationOutcome.FAILED) ||
        (payment.status === PaymentStatus.EXPIRED && outcome === PaymentVerificationOutcome.EXPIRED)
      ) {
        return {
          success: false,
          outcome,
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

        // Occupy table for dine-in orders
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
          outcome === PaymentVerificationOutcome.EXPIRED
            ? PaymentStatus.EXPIRED
            : PaymentStatus.FAILED;
        targetOrderStatus = OrderStatus.CANCELLED;

        // Release table hold
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

        // Restore stock if previously deducted
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
          txRef: dto.transactionRef || payment.txRef,
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

      // Queue post-commit notifications to run after transaction commits
      if (this.notifications) {
        if (isSuccess) {
          if (order.customerId) {
            notificationTasks.push(() =>
              this.notifications!.createForUser({
                recipientUserId: order.customerId!,
                title: 'Payment Confirmed',
                message: `Your payment of ${order.total} ETB for Order #${order.number} was confirmed.`,
                type: NotificationType.PAYMENT_SUCCESS,
                relatedEntityId: order.id,
                idempotencyKey: `notif_pay_succ_cust_${payment.id}`,
              }),
            );
          }

          notificationTasks.push(() =>
            this.notifications!.createForRole(Role.STAFF, {
              title: 'Payment Received',
              message: `Payment of ${order.total} ETB confirmed for Order #${order.number}.`,
              type: NotificationType.PAYMENT_SUCCESS,
              relatedEntityId: order.id,
              idempotencyKey: `notif_pay_succ_staff_${payment.id}`,
            }),
          );
        } else {
          if (order.customerId) {
            notificationTasks.push(() =>
              this.notifications!.createForUser({
                recipientUserId: order.customerId!,
                title: 'Payment Failed',
                message: `Payment for Order #${order.number} was not completed (${outcome}).`,
                type: NotificationType.PAYMENT_FAILURE,
                relatedEntityId: order.id,
                idempotencyKey: `notif_pay_fail_cust_${payment.id}`,
              }),
            );
          }

          notificationTasks.push(() =>
            this.notifications!.createForRole(Role.STAFF, {
              title: 'Order Cancelled (Payment Failed)',
              message: `Order #${order.number} cancelled due to payment outcome: ${outcome}.`,
              type: NotificationType.ORDER_CANCELLED,
              relatedEntityId: order.id,
              idempotencyKey: `notif_order_cancel_staff_${payment.id}`,
            }),
          );

          notificationTasks.push(() =>
            this.notifications!.createForRole(Role.ADMIN, {
              title: 'Payment Issue Reported',
              message: `Payment failed for Order #${order.number}. Outcome: ${outcome}.`,
              type: NotificationType.PAYMENT_ISSUE,
              relatedEntityId: order.id,
              idempotencyKey: `notif_pay_issue_admin_${payment.id}`,
            }),
          );
        }
      }

      return {
        success: isSuccess,
        outcome,
        orderStatus: toApiOrderStatus(targetOrderStatus),
        paymentStatus: toApiPaymentStatus(targetPaymentStatus),
        payment: toPaymentResponse(updatedPayment),
      };
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    // Execute post-commit notifications safely
    for (const task of notificationTasks) {
      try {
        await task();
      } catch (err) {
        this.logger.warn(`Failed to dispatch notification: ${String(err)}`);
      }
    }

    return result;
  }

  /**
   * Handle incoming Chapa Webhook
   */
  async handleWebhook(
    payload: any,
    signature?: string,
  ): Promise<{ status: string; processed: boolean }> {
    const txRef = payload?.tx_ref || payload?.data?.tx_ref;
    if (!txRef) {
      throw new BadRequestException('Webhook payload missing tx_ref');
    }

    if (signature && this.chapa) {
      const isValid = this.chapa.verifyWebhookSignature(signature, payload);
      if (!isValid) {
        this.logger.warn(`Invalid Chapa webhook signature for txRef: ${txRef}`);
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    const status = (payload?.status || payload?.data?.status || '').toLowerCase();
    const outcome =
      status === 'success'
        ? PaymentVerificationOutcome.SUCCESS
        : PaymentVerificationOutcome.FAILED;

    const result = await this.verify(txRef, {
      outcome,
      transactionRef: txRef,
    });

    return {
      status: 'ok',
      processed: result.success,
    };
  }
}
