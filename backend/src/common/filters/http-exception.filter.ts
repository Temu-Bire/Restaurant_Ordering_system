import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string | string[]) || exception.message;
        error = (resObj.error as string) || exception.name;
      } else {
        message = String(res);
        error = exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          const target = exception.meta?.target;
          message = target
            ? `Duplicate entry for ${Array.isArray(target) ? target.join(', ') : typeof target === 'string' ? target : JSON.stringify(target)}`
            : 'A record with this value already exists';
          error = 'Conflict';
          break;
        }
        case 'P2025': {
          status = HttpStatus.NOT_FOUND;
          message = 'The requested resource was not found';
          error = 'Not Found';
          break;
        }
        case 'P2003': {
          status = HttpStatus.BAD_REQUEST;
          message = 'Related resource not found or still in use';
          error = 'Bad Request';
          break;
        }
        default: {
          status = HttpStatus.BAD_REQUEST;
          message = 'Database operation failed';
          error = 'Bad Request';
          this.logger.warn(`Prisma error ${exception.code}: ${exception.message}`);
          break;
        }
      }
    } else {
      const err = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(`Unhandled error on ${request.method} ${request.url}: ${err.message}`, err.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
