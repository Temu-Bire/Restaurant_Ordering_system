import { Prisma } from '@prisma/client';

// P2002 = unique value already exists
// P2003 = foreign key problem (missing parent, or still in use)
// P2025 = record not found
export const isPrismaError = (
  error: unknown,
  code: 'P2002' | 'P2003' | 'P2025',
): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;