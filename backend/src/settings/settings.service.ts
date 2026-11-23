import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { NotificationType, OrderType, PaymentMethod, Prisma, Role, Settings } from '@prisma/client';
import { toApiOrderType, toApiPaymentMethod } from '../common/api-enums.js';
import { NotificationService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';

const money = (value: Prisma.Decimal) => value.toNumber();

export const toSettingsResponse = (settings: Settings) => {
  const orderTypes = [
    settings.dineInEnabled ? OrderType.DINE_IN : null,
    settings.takeawayEnabled ? OrderType.TAKEAWAY : null,
    settings.deliveryEnabled ? OrderType.DELIVERY : null,
  ].flatMap((type) => (type ? [toApiOrderType(type)] : []));

  const paymentMethods = [toApiPaymentMethod(PaymentMethod.MOBILE)];

  return {
    name: settings.name,
    phone: settings.phone,
    address: settings.address,
    currency: settings.currency,
    taxRate: money(settings.taxRate),
    orderTypes,
    deliveryFee: money(settings.deliveryFee),
    paymentMethods,
    lowStockMinimum: money(settings.lowStockMinimum),
  };
};

@Injectable()
export class SettingsService {
  private cachedSettings: ReturnType<typeof toSettingsResponse> | null = null;
  private cacheExpiresAt = 0;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notifications?: NotificationService,
  ) {}

  async get() {
    const now = Date.now();
    if (this.cachedSettings && this.cacheExpiresAt > now) {
      return this.cachedSettings;
    }

    const settings = await this.prisma.settings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    });
    const mapped = toSettingsResponse(settings);
    this.cachedSettings = mapped;
    this.cacheExpiresAt = now + 60_000; // 60-second in-memory cache
    return mapped;
  }

  async update(dto: UpdateSettingsDto) {
    this.cachedSettings = null;
    this.cacheExpiresAt = 0;

    if (dto.orderTypes && dto.orderTypes.length === 0) {
      throw new BadRequestException('Enable at least one order type');
    }

    const current = await this.prisma.settings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    });

    const orderTypes = dto.orderTypes as OrderType[] | undefined;

    const settings = await this.prisma.settings.update({
      where: { id: current.id },
      data: {
        name: dto.name?.trim(),
        phone: dto.phone?.trim(),
        address: dto.address?.trim(),
        currency: dto.currency,
        taxRate: dto.taxRate,
        deliveryFee: dto.deliveryFee,
        lowStockMinimum: dto.lowStockMinimum,
        dineInEnabled: orderTypes?.includes(OrderType.DINE_IN),
        takeawayEnabled: orderTypes?.includes(OrderType.TAKEAWAY),
        deliveryEnabled: orderTypes?.includes(OrderType.DELIVERY),
        cashEnabled: false,
        cardEnabled: false,
        mobileEnabled: true,
      },
    });

    if (this.notifications) {
      void this.notifications.createForRole(Role.ADMIN, {
        title: 'System Settings Updated',
        message: 'Restaurant system configuration was updated.',
        type: NotificationType.SYSTEM_EVENT,
        idempotencyKey: `notif_settings_update_${Date.now()}`,
      });
    }

    return toSettingsResponse(settings);
  }
}
