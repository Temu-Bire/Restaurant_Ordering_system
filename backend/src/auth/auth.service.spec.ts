import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
    changePassword: ReturnType<typeof vi.fn>;
  };
  let jwtService: {
    signAsync: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
    };
    jwtService = {
      signAsync: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a customer user with hashed password and return public user', async () => {
      const mockCreatedUser = {
        id: 'user-1',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '1234567890',
        address: null,
        role: Role.CUSTOMER,
        isActive: true,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.create.mockResolvedValueOnce(mockCreatedUser);

      const result = await service.register({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '1234567890',
        password: 'Password123!',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          role: Role.CUSTOMER,
        }),
      );
      expect(result).toEqual({
        id: 'user-1',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '1234567890',
        address: null,
        role: Role.CUSTOMER,
        isActive: true,
      });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('should return access token and public user for valid credentials', async () => {
      const hashedPassword = await hash('ValidPass123!', 10);
      const user = {
        id: 'user-123',
        fullName: 'Admin User',
        email: 'admin@example.com',
        phone: null,
        address: null,
        role: Role.ADMIN,
        isActive: true,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersService.findByEmail.mockResolvedValueOnce(user);
      jwtService.signAsync.mockResolvedValueOnce('mocked.jwt.token');

      const result = await service.login({
        email: 'admin@example.com',
        password: 'ValidPass123!',
      });

      expect(result.accessToken).toBe('mocked.jwt.token');
      expect(result.user.email).toBe('admin@example.com');
      expect(result.user).not.toHaveProperty('password');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        role: user.role,
      });
    });

    it('should throw UnauthorizedException if email is not found', async () => {
      usersService.findByEmail.mockResolvedValueOnce(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hashedPassword = await hash('CorrectPassword123!', 10);
      usersService.findByEmail.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        password: hashedPassword,
        isActive: true,
      });

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'WrongPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user account is disabled', async () => {
      const hashedPassword = await hash('Password123!', 10);
      usersService.findByEmail.mockResolvedValueOnce({
        id: 'user-disabled',
        email: 'disabled@example.com',
        password: hashedPassword,
        isActive: false,
      });

      await expect(
        service.login({
          email: 'disabled@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
