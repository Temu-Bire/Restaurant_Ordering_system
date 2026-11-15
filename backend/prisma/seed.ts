import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const users = [
  { fullName: 'John Doe', email: 'john@email.com', role: Role.CUSTOMER },
  { fullName: 'Sara Tesfaye', email: 'sara@restro.com', role: Role.STAFF },
  { fullName: 'Admin', email: 'admin@restro.com', role: Role.ADMIN },
];

const categories = ['Pizza', 'Burger', 'Salad', 'Drinks', 'Desserts', 'Sides'];

const foods = [
  { name: 'Margherita Pizza', category: 'Pizza', price: 12.99, description: 'Fresh pizza with tomato and cheese' },
  { name: 'Pepperoni Pizza', category: 'Pizza', price: 14.99, description: 'Classic pepperoni on tomato and cheese' },
  { name: 'Chicken Burger', category: 'Burger', price: 8.99, description: 'Grilled chicken, lettuce and sauce' },
  { name: 'Caesar Salad', category: 'Salad', price: 7.99, description: 'Crisp lettuce with Caesar dressing' },
  { name: 'French Fries', category: 'Sides', price: 3.99, description: 'Golden and crispy' },
  { name: 'Iced Coffee', category: 'Drinks', price: 3.99, description: 'Cold brewed coffee over ice' },
  { name: 'Chocolate Cake', category: 'Desserts', price: 5.99, description: 'Rich chocolate layer cake', isAvailable: false },
  { name: 'Orange Juice', category: 'Drinks', price: 3.49, description: 'Freshly squeezed' },
];

async function main() {
  const password = await hash('password123', 10);

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, password },
    });
  }

  const categoryIds = new Map<string, string>();
  for (const name of categories) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryIds.set(name, category.id);
  }

  for (const { category, ...food } of foods) {
    await prisma.food.upsert({
      where: { name: food.name },
      update: {},
      create: { ...food, categoryId: categoryIds.get(category)! },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());