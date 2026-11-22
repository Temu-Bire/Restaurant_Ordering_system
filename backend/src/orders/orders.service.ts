import { Prisma } from '@prisma/client';

export { OrdersService } from './services/orders.service.js';
export { OrderQueryService } from './services/order-query.service.js';
export { OrderCheckoutService } from './services/order-checkout.service.js';
export { OrderLifecycleService, PERMITTED_STATUS_TRANSITIONS } from './services/order-lifecycle.service.js';
export { OrderTableService } from './services/order-table.service.js';
export {
  orderInclude,
  toOrderResponse,
  type OrderRecord,
  type OrderResponse,
  type OrderItemLineResponse,
} from './helpers/order-response.mapper.js';
export {
  mergeItems,
  calculatePrepTimeMinutes,
  formatApiOrderType,
  OPEN_ORDER_STATUSES,
  CUSTOMER_CANCELLABLE_STATUSES,
} from './helpers/order-items.helper.js';

/**
 * Backward-compatible function export for adjustOrderStock.
 */
export async function adjustOrderStock(
  tx: Prisma.TransactionClient,
  lines: { food: { name: string; recipes: { ingredientId: string; quantity: Prisma.Decimal }[] }; quantity: number }[],
  direction: 'deduct' | 'restore',
) {
  // Direct transactional stock adjustment implementation
  const needed = new Map<string, Prisma.Decimal>();
  for (const line of lines) {
    for (const recipe of line.food.recipes) {
      const amount = new Prisma.Decimal(recipe.quantity).mul(line.quantity);
      needed.set(
        recipe.ingredientId,
        (needed.get(recipe.ingredientId) ?? new Prisma.Decimal(0)).add(amount),
      );
    }
  }

  for (const [ingredientId, amount] of needed) {
    const ingredient = await tx.ingredient.findUnique({ where: { id: ingredientId } });
    if (!ingredient) continue;

    const prevStock = ingredient.stock;

    if (direction === 'restore') {
      const newStock = prevStock.add(amount);
      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { stock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          ingredientId,
          type: 'ADJUSTMENT',
          quantityChanged: amount,
          previousQuantity: prevStock,
          newQuantity: newStock,
          reason: 'Order cancellation: stock restored',
        },
      });
      continue;
    }

    if (prevStock.lessThan(amount)) {
      throw new Error(
        `Not enough ${ingredient.name} in stock (requires ${amount.toNumber()} ${ingredient.unit}, available: ${prevStock.toNumber()} ${ingredient.unit})`,
      );
    }

    const newStock = prevStock.sub(amount);
    await tx.ingredient.update({
      where: { id: ingredientId },
      data: { stock: newStock },
    });

    await tx.stockMovement.create({
      data: {
        ingredientId,
        type: 'ORDER_CONSUMPTION',
        quantityChanged: amount.negated(),
        previousQuantity: prevStock,
        newQuantity: newStock,
        reason: 'Order preparation consumption',
      },
    });

    const insufficientRecipes = await tx.recipeLine.findMany({
      where: {
        ingredientId,
        quantity: { gt: newStock },
      },
      select: { foodId: true },
    });

    if (insufficientRecipes.length > 0) {
      const foodIds = insufficientRecipes.map((r) => r.foodId);
      await tx.food.updateMany({
        where: { id: { in: foodIds } },
        data: { isAvailable: false },
      });
    }
  }
}
