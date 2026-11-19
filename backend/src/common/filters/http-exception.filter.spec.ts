import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = vi.fn();
    mockStatus = vi.fn().mockImplementation(() => ({ json: mockJson }));

    const mockResponse = {
      status: mockStatus,
    };

    const mockRequest = {
      method: 'GET',
      url: '/api/test',
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should format standard HttpException properly', () => {
    const exception = new HttpException('Forbidden resource', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden resource',
        error: 'HttpException',
        path: '/api/test',
      }),
    );
  });

  it('should map Prisma P2002 to 409 Conflict', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Unique error', {
      code: 'P2002',
      clientVersion: '7.10.1',
      meta: { target: ['email'] },
    });

    filter.catch(prismaError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: 'Duplicate entry for email',
      }),
    );
  });

  it('should map Prisma P2025 to 404 Not Found', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Not found error', {
      code: 'P2025',
      clientVersion: '7.10.1',
    });

    filter.catch(prismaError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      }),
    );
  });

  it('should catch unknown errors and return 500 Internal Server Error', () => {
    const error = new Error('Unexpected crash');

    filter.catch(error, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
      }),
    );
  });
});
