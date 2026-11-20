import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDeliveryTierDto } from './dto/tier.dto.js';
import { UpdateDeliveryTierDto } from './dto/update-tier.dto.js';
import { UpdateDeliveryConfigDto } from './dto/delivery-config.dto.js';
import { DeliveryQuoteDto } from './dto/quote.dto.js';

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

@Injectable()
export class DeliveryService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Seed default delivery tiers if none exist
    const count = await this.prisma.deliveryTier.count();
    if (count === 0) {
      await this.prisma.deliveryTier.createMany({
        data: [
          { minDistance: new Prisma.Decimal(0), maxDistance: new Prisma.Decimal(1), fee: new Prisma.Decimal(30) },
          { minDistance: new Prisma.Decimal(1), maxDistance: new Prisma.Decimal(2), fee: new Prisma.Decimal(50) },
          { minDistance: new Prisma.Decimal(2), maxDistance: new Prisma.Decimal(3), fee: new Prisma.Decimal(70) },
          { minDistance: new Prisma.Decimal(3), maxDistance: new Prisma.Decimal(4), fee: new Prisma.Decimal(90) },
          { minDistance: new Prisma.Decimal(4), maxDistance: new Prisma.Decimal(5), fee: new Prisma.Decimal(110) },
          { minDistance: new Prisma.Decimal(5), maxDistance: new Prisma.Decimal(10), fee: new Prisma.Decimal(150) },
          { minDistance: new Prisma.Decimal(10), maxDistance: new Prisma.Decimal(15), fee: new Prisma.Decimal(200) },
        ],
      });
    }
  }

  async getConfig() {
    const settings = await this.prisma.settings.findFirst({
      where: { id: 'default' },
    });

    const defaultLat = 9.005401; // Bole, Addis Ababa
    const defaultLng = 38.763611;

    return {
      deliveryEnabled: settings?.deliveryEnabled ?? true,
      restaurantAddress: settings?.address ?? 'Bole, Addis Ababa',
      restaurantLat: settings?.restaurantLat?.toNumber() ?? defaultLat,
      restaurantLng: settings?.restaurantLng?.toNumber() ?? defaultLng,
      maxDeliveryDistanceKm: settings?.maxDeliveryDistanceKm?.toNumber() ?? 15,
      minDeliveryOrderAmount: settings?.minDeliveryOrderAmount?.toNumber() ?? 0,
    };
  }

  async updateConfig(dto: UpdateDeliveryConfigDto) {
    const updated = await this.prisma.settings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        deliveryEnabled: dto.deliveryEnabled ?? true,
        restaurantLat: dto.restaurantLat !== undefined ? new Prisma.Decimal(dto.restaurantLat) : new Prisma.Decimal(9.005401),
        restaurantLng: dto.restaurantLng !== undefined ? new Prisma.Decimal(dto.restaurantLng) : new Prisma.Decimal(38.763611),
        maxDeliveryDistanceKm: dto.maxDeliveryDistanceKm !== undefined ? new Prisma.Decimal(dto.maxDeliveryDistanceKm) : new Prisma.Decimal(15),
        minDeliveryOrderAmount: dto.minDeliveryOrderAmount !== undefined ? new Prisma.Decimal(dto.minDeliveryOrderAmount) : new Prisma.Decimal(0),
      },
      update: {
        ...(dto.deliveryEnabled !== undefined && { deliveryEnabled: dto.deliveryEnabled }),
        ...(dto.restaurantLat !== undefined && { restaurantLat: new Prisma.Decimal(dto.restaurantLat) }),
        ...(dto.restaurantLng !== undefined && { restaurantLng: new Prisma.Decimal(dto.restaurantLng) }),
        ...(dto.maxDeliveryDistanceKm !== undefined && { maxDeliveryDistanceKm: new Prisma.Decimal(dto.maxDeliveryDistanceKm) }),
        ...(dto.minDeliveryOrderAmount !== undefined && { minDeliveryOrderAmount: new Prisma.Decimal(dto.minDeliveryOrderAmount) }),
      },
    });

    return {
      deliveryEnabled: updated.deliveryEnabled,
      restaurantLat: updated.restaurantLat?.toNumber() ?? 9.005401,
      restaurantLng: updated.restaurantLng?.toNumber() ?? 38.763611,
      maxDeliveryDistanceKm: updated.maxDeliveryDistanceKm.toNumber(),
      minDeliveryOrderAmount: updated.minDeliveryOrderAmount.toNumber(),
    };
  }

  async getTiers() {
    const tiers = await this.prisma.deliveryTier.findMany({
      orderBy: { minDistance: 'asc' },
    });
    return tiers.map((t) => ({
      id: t.id,
      minDistance: t.minDistance.toNumber(),
      maxDistance: t.maxDistance.toNumber(),
      fee: t.fee.toNumber(),
    }));
  }

  async createTier(dto: CreateDeliveryTierDto) {
    if (dto.minDistance >= dto.maxDistance) {
      throw new BadRequestException('Min distance must be less than max distance');
    }
    const tier = await this.prisma.deliveryTier.create({
      data: {
        minDistance: new Prisma.Decimal(dto.minDistance),
        maxDistance: new Prisma.Decimal(dto.maxDistance),
        fee: new Prisma.Decimal(dto.fee),
      },
    });
    return {
      id: tier.id,
      minDistance: tier.minDistance.toNumber(),
      maxDistance: tier.maxDistance.toNumber(),
      fee: tier.fee.toNumber(),
    };
  }

  async updateTier(id: string, dto: UpdateDeliveryTierDto) {
    const existing = await this.prisma.deliveryTier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Delivery tier not found');

    const min = dto.minDistance ?? existing.minDistance.toNumber();
    const max = dto.maxDistance ?? existing.maxDistance.toNumber();
    if (min >= max) {
      throw new BadRequestException('Min distance must be less than max distance');
    }

    const tier = await this.prisma.deliveryTier.update({
      where: { id },
      data: {
        ...(dto.minDistance !== undefined && { minDistance: new Prisma.Decimal(dto.minDistance) }),
        ...(dto.maxDistance !== undefined && { maxDistance: new Prisma.Decimal(dto.maxDistance) }),
        ...(dto.fee !== undefined && { fee: new Prisma.Decimal(dto.fee) }),
      },
    });

    return {
      id: tier.id,
      minDistance: tier.minDistance.toNumber(),
      maxDistance: tier.maxDistance.toNumber(),
      fee: tier.fee.toNumber(),
    };
  }

  async deleteTier(id: string) {
    const existing = await this.prisma.deliveryTier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Delivery tier not found');
    await this.prisma.deliveryTier.delete({ where: { id } });
  }

  async calculateQuote(dto: DeliveryQuoteDto) {
    const [config, tiers] = await Promise.all([this.getConfig(), this.getTiers()]);

    if (!config.deliveryEnabled) {
      return {
        eligible: false,
        distanceKm: 0,
        fee: 0,
        minOrderMet: true,
        minOrderAmount: config.minDeliveryOrderAmount,
        maxDistanceKm: config.maxDeliveryDistanceKm,
        message: 'Delivery service is currently disabled by the restaurant.',
      };
    }

    const distance = calculateHaversineDistanceKm(
      config.restaurantLat,
      config.restaurantLng,
      dto.latitude,
      dto.longitude,
    );

    const subtotal = dto.subtotal ?? 0;
    const minOrderMet = subtotal >= config.minDeliveryOrderAmount;

    if (distance > config.maxDeliveryDistanceKm) {
      return {
        eligible: false,
        distanceKm: distance,
        fee: 0,
        minOrderMet,
        minOrderAmount: config.minDeliveryOrderAmount,
        maxDistanceKm: config.maxDeliveryDistanceKm,
        message: `Your location (${distance} km) is outside our maximum delivery boundary of ${config.maxDeliveryDistanceKm} km.`,
      };
    }

    if (!minOrderMet) {
      return {
        eligible: false,
        distanceKm: distance,
        fee: 0,
        minOrderMet: false,
        minOrderAmount: config.minDeliveryOrderAmount,
        maxDistanceKm: config.maxDeliveryDistanceKm,
        message: `Minimum order amount for delivery is ${config.minDeliveryOrderAmount} Birr.`,
      };
    }

    // Match tier
    const matchedTier = tiers.find(
      (t) => distance >= t.minDistance && distance <= t.maxDistance,
    );

    const fee = matchedTier ? matchedTier.fee : (tiers[tiers.length - 1]?.fee ?? 50);

    return {
      eligible: true,
      distanceKm: distance,
      fee,
      minOrderMet: true,
      minOrderAmount: config.minDeliveryOrderAmount,
      maxDistanceKm: config.maxDeliveryDistanceKm,
    };
  }
}
