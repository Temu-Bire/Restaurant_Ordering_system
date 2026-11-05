import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
    constructor(private readonly prismaService: PrismaService) {}

    @Get()
    async checkHealth() {
        try {
            await this.prismaService.$queryRaw`SELECT 1`;
            return { status: 'ok' , database: 'connected'};
        } catch (error) {
            return { status: 'error', message: error instanceof Error ? error.message : String(error) };
        }
    }
}
