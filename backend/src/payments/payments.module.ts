import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentInitiationService } from './services/payment-initiation.service.js';
import { PaymentVerificationService } from './services/payment-verification.service.js';
import { PaymentsService } from './services/payments.service.js';
import { ReceiptService } from './services/receipt.service.js';

@Module({
  imports: [InventoryModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentInitiationService,
    PaymentVerificationService,
    ReceiptService,
  ],
  exports: [
    PaymentsService,
    PaymentInitiationService,
    PaymentVerificationService,
    ReceiptService,
  ],
})
export class PaymentsModule {}
