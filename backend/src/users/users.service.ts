import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { isPrismaError } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { toPublicUser } from './public-user.js';

interface CreateUserData {
  fullName: string;
  email: string;
  phone?: string;
  password: string; // already hashed
  role: Role;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserData) {
    try {
      return await this.prisma.user.create({ data });
    } catch (error) {
      // P2002 = unique constraint failed. Catching it is safe even when
      // two sign-ups race, unlike "check first, then create"
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map(toPublicUser);
  }

  async createByAdmin(dto: CreateUserDto) {
    const user = await this.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      password: await hash(dto.password, 10),
      role: dto.role,
      isActive: dto.isActive,
    });
    return toPublicUser(user);
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException('User not found');

    if (actorId === id && dto.role && dto.role !== current.role) {
      throw new BadRequestException('You cannot change your own role');
    }
    if (actorId === id && dto.isActive === false) {
      throw new BadRequestException('You cannot disable your own account');
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          email: dto.email,
          role: dto.role,
          isActive: dto.isActive,
        },
      });
      return toPublicUser(user);
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('User not found');
      }
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async remove(id: string, actorId: string) {
    if (actorId === id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const current = await this.findById(id);
    if (!current) throw new NotFoundException('User not found');
    if (current.role === Role.ADMIN) {
      throw new BadRequestException('Administrator accounts cannot be deleted');
    }

    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (isPrismaError(error, 'P2003')) {
        throw new ConflictException(
          'This user has orders and cannot be deleted. Disable the account instead.',
        );
      }
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone?.trim() ? dto.phone.trim() : null,
          address: dto.address?.trim() ? dto.address.trim() : null,
        },
      });
      return toPublicUser(user);
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const matches = await compare(dto.currentPassword, user.password);
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Choose a password that is different from the current one');
    }

    await this.prisma.user.update({
      where: { id },
      data: { password: await hash(dto.newPassword, 10) },
    });
  }
}