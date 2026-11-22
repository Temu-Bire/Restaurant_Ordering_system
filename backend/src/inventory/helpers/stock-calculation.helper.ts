import { Prisma } from '@prisma/client';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export function calculateStockStatus(
  stock: number | Prisma.Decimal,
  minimum: number | Prisma.Decimal,
): StockStatus {
  const stockNum = typeof stock === 'number' ? stock : stock.toNumber();
  const minNum = typeof minimum === 'number' ? minimum : minimum.toNumber();

  if (stockNum <= 0) return 'out_of_stock';
  if (stockNum <= minNum) return 'low_stock';
  return 'in_stock';
}

export function toDecimal(value: number | string | Prisma.Decimal): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) {
    return value;
  }
  return new Prisma.Decimal(value);
}
