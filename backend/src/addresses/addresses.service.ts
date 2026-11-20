import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAddressDto } from './dto/create-address.dto.js';
import { UpdateAddressDto } from './dto/update-address.dto.js';

export const toAddressResponse = (addr: {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  city: string;
  area: string;
  street: string;
  landmark: string | null;
  building: string | null;
  apartment: string | null;
  deliveryInstructions: string | null;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  isDefault: boolean;
  createdAt: Date;
}) => ({
  id: addr.id,
  label: addr.label,
  recipientName: addr.recipientName,
  phone: addr.phone,
  city: addr.city,
  area: addr.area,
  street: addr.street,
  landmark: addr.landmark ?? undefined,
  building: addr.building ?? undefined,
  apartment: addr.apartment ?? undefined,
  deliveryInstructions: addr.deliveryInstructions ?? undefined,
  latitude: addr.latitude.toNumber(),
  longitude: addr.longitude.toNumber(),
  isDefault: addr.isDefault,
  createdAt: addr.createdAt.toISOString(),
});

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return addresses.map(toAddressResponse);
  }

  async get(userId: string, id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have access to this address');
    }
    return toAddressResponse(address);
  }

  async create(userId: string, dto: CreateAddressDto) {
    const count = await this.prisma.address.count({ where: { userId } });
    const isFirst = count === 0;
    const shouldBeDefault = isFirst || dto.isDefault === true;

    return this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const created = await tx.address.create({
        data: {
          userId,
          label: dto.label,
          recipientName: dto.recipientName,
          phone: dto.phone,
          city: dto.city,
          area: dto.area,
          street: dto.street,
          landmark: dto.landmark,
          building: dto.building,
          apartment: dto.apartment,
          deliveryInstructions: dto.deliveryInstructions,
          latitude: new Prisma.Decimal(dto.latitude),
          longitude: new Prisma.Decimal(dto.longitude),
          isDefault: shouldBeDefault,
        },
      });

      return toAddressResponse(created);
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have access to this address');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.address.updateMany({
          where: { userId, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const updated = await tx.address.update({
        where: { id },
        data: {
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.recipientName !== undefined && { recipientName: dto.recipientName }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.area !== undefined && { area: dto.area }),
          ...(dto.street !== undefined && { street: dto.street }),
          ...(dto.landmark !== undefined && { landmark: dto.landmark }),
          ...(dto.building !== undefined && { building: dto.building }),
          ...(dto.apartment !== undefined && { apartment: dto.apartment }),
          ...(dto.deliveryInstructions !== undefined && { deliveryInstructions: dto.deliveryInstructions }),
          ...(dto.latitude !== undefined && { latitude: new Prisma.Decimal(dto.latitude) }),
          ...(dto.longitude !== undefined && { longitude: new Prisma.Decimal(dto.longitude) }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
      });

      return toAddressResponse(updated);
    });
  }

  async delete(userId: string, id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have access to this address');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });
      if (address.isDefault) {
        const remaining = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (remaining) {
          await tx.address.update({
            where: { id: remaining.id },
            data: { isDefault: true },
          });
        }
      }
    });
  }

  async setDefault(userId: string, id: string) {
    return this.update(userId, id, { isDefault: true });
  }
}
