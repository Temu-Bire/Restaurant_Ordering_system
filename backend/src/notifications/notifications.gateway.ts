import {
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';

@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
        return;
      }
      const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || [];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by WebSocket CORS'));
      }
    },
    credentials: true,
  },
  namespace: '/',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.debug(`Socket ${client.id} missing token, disconnecting`);
        client.disconnect(true);
        return;
      }

      const secret = this.config.getOrThrow<string>('JWT_SECRET');
      const payload = await this.jwt.verifyAsync<{ sub: string; role: Role }>(
        token,
        { secret },
      );

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, isActive: true, fullName: true },
      });

      if (!user || !user.isActive) {
        this.logger.debug(`Socket ${client.id} user not active, disconnecting`);
        client.disconnect(true);
        return;
      }

      client.data.user = user;

      // Join private user room and role-based room
      await client.join(`user:${user.id}`);
      await client.join(`role:${user.role}`);

      this.logger.debug(
        `Socket connected: ${client.id} (User: ${user.fullName}, Role: ${user.role})`,
      );
    } catch (error) {
      this.logger.warn(`Socket authentication failed for ${client.id}: ${String(error)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data?.user;
    this.logger.debug(
      `Socket disconnected: ${client.id}${user ? ` (User: ${user.id})` : ''}`,
    );
  }

  private extractToken(client: Socket): string | null {
    const authHeader =
      client.handshake.headers.authorization ||
      client.handshake.auth?.token ||
      (client.handshake.query?.token as string);

    if (!authHeader) return null;

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return typeof authHeader === 'string' ? authHeader : null;
  }

  /**
   * Dispatch real-time notification to a specific user
   */
  sendToUser(userId: string, notification: unknown) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  /**
   * Dispatch real-time notification to all users of a specific role
   */
  sendToRole(role: Role, notification: unknown) {
    if (!this.server) return;
    this.server.to(`role:${role}`).emit('notification:new', notification);
  }

  /**
   * Emit unread count update to user
   */
  sendUnreadCount(userId: string, count: number) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit('notification:count', { count });
  }
}
