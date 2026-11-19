import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $queryRaw: ReturnType<typeof vi.fn> };
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    prisma = {
      $queryRaw: vi.fn(),
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return status ok when database ping succeeds', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

    const result = await controller.checkHealth(mockResponse as Response);

    expect(result.status).toBe('ok');
    expect(result.database.status).toBe('connected');
    expect(typeof result.database.latencyMs).toBe('number');
    expect(typeof result.uptime).toBe('number');
    expect(result.memory).toHaveProperty('heapUsedMb');
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return degraded status and 503 when database ping fails', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('Connection lost'));

    const result = await controller.checkHealth(mockResponse as Response);

    expect(result.status).toBe('degraded');
    expect(result.database.status).toBe('disconnected');
    expect(result.database.error).toBe('Connection lost');
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });
});
