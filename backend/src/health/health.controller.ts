import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async checkHealth(@Res({ passthrough: true }) res: Response) {
    const startTime = Date.now();
    let dbStatus: 'connected' | 'disconnected' = 'connected';
    let dbError: string | undefined;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'disconnected';
      dbError = error instanceof Error ? error.message : String(error);
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    const latencyMs = Date.now() - startTime;
    const memory = process.memoryUsage();

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
      },
    };
  }
}
