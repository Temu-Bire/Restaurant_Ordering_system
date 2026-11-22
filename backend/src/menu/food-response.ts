import { Category, Food } from '@prisma/client';

export type FoodWithCategory = Food & { category: Category };

export const toFoodResponse = (
  food: FoodWithCategory,
  appUrl: string,
  stats?: { rating: number; reviewCount: number },
) => ({
  id: food.id,
  name: food.name,
  description: food.description,
  price: food.price.toNumber(),
  imageUrl: food.imagePath ? `${appUrl}${food.imagePath}` : null,
  isAvailable: food.isAvailable,
  categoryId: food.categoryId,
  category: { id: food.category.id, name: food.category.name },
  rating: stats?.rating ?? 0,
  reviewCount: stats?.reviewCount ?? 0,
});