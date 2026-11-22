import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ChapaGateway } from './gateways/chapa.gateway.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentInitiationService } from './services/payment-initiation.service.js';
import { PaymentVerificationService } from './services/payment-verification.service.js';
import { PaymentsService } from './services/payments.service.js';
import { ReceiptService } from './services/receipt.service.js';

@Module({
  imports: [InventoryModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentInitiationService,
    PaymentVerificationService,
    ReceiptService,
    ChapaGateway,
  ],
  exports: [
    PaymentsService,
    PaymentInitiationService,
    PaymentVerificationService,
    ReceiptService,
    ChapaGateway,
  ],
})
export class PaymentsModule {}
