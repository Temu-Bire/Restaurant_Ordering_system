import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PrismaClient,
  Role,
  TableStatus,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const users = [
  {
    fullName: 'Abebe Bikila',
    email: 'admin@habesha.com',
    phone: '+251 911 223344',
    address: 'Bole Sub-City, Addis Ababa',
    role: Role.ADMIN,
  },
  {
    fullName: 'Admin Abebe',
    email: 'admin@restro.com',
    phone: '+251 911 223344',
    address: 'Bole Sub-City, Addis Ababa',
    role: Role.ADMIN,
  },
  {
    fullName: 'Almaz Ayana',
    email: 'staff@habesha.com',
    phone: '+251 922 334455',
    address: 'Kazanchis, Kirkos, Addis Ababa',
    role: Role.STAFF,
  },
  {
    fullName: 'Sara Tesfaye',
    email: 'sara@restro.com',
    phone: '+251 922 334456',
    address: 'Piassa, Arada, Addis Ababa',
    role: Role.STAFF,
  },
  {
    fullName: 'Dawit Kebede',
    email: 'dawit@email.com',
    phone: '+251 933 445566',
    address: 'Sarbet, Old Airport, Addis Ababa',
    role: Role.CUSTOMER,
  },
  {
    fullName: 'Selamawit Desta',
    email: 'selam@email.com',
    phone: '+251 944 556677',
    address: 'CMC, Yeka, Addis Ababa',
    role: Role.CUSTOMER,
  },
  {
    fullName: 'John Doe',
    email: 'john@email.com',
    phone: '+251 955 667788',
    address: 'Meskel Square, Addis Ababa',
    role: Role.CUSTOMER,
  },
];

const categories = [
  'Tibs (Meat Dishes)',
  'Wot & Stews',
  'Fasting & Vegetarian',
  'Breakfast & Firfir',
  'Traditional Beverages',
  'Desserts & Coffee',
];

const foods = [
  {
    name: 'Special Beef Tibs',
    category: 'Tibs (Meat Dishes)',
    price: 480.0,
    description:
      'Tender beef cubes sauteed with onions, fresh rosemary, jalapeños, and spiced butter (Niter Kibbeh) served with warm Teff Injera.',
  },
  {
    name: 'Shekla Tibs',
    category: 'Tibs (Meat Dishes)',
    price: 520.0,
    description:
      'Sizzling marinated beef served on a traditional clay pot over glowing hot charcoal, with awaze and mitmita.',
  },
  {
    name: 'Doro Wot (Special Feast)',
    category: 'Wot & Stews',
    price: 580.0,
    description:
      "Ethiopia's signature celebratory dish: tender chicken drumstick slow-simmered in rich berbere sauce with hard-boiled egg and fresh Ayib.",
  },
  {
    name: 'Kitfo Special',
    category: 'Wot & Stews',
    price: 550.0,
    description:
      'Minced prime lean beef seasoned with warm clarified spiced butter (Niter Kibbeh) and mitmita, served with Gomen, Ayib, and Kocho.',
  },
  {
    name: 'Shiro Tegabino',
    category: 'Fasting & Vegetarian',
    price: 260.0,
    description:
      'Simmering spiced chickpea flour stew served bubbling hot in a traditional clay pot with freshly rolled Teff Injera.',
  },
  {
    name: 'Beyeaynetu (Fasting Platter)',
    category: 'Fasting & Vegetarian',
    price: 320.0,
    description:
      'Colorful traditional vegan combination feast: Misir Wot, Kik Alicha, Gomen, Atkilt Wot, Fosolia, and Beetroot salad over Injera.',
  },
  {
    name: 'Special Beef Firfir',
    category: 'Breakfast & Firfir',
    price: 290.0,
    description:
      'Shredded injera pieces tossed in flavorful spicy berbere sauce enriched with tender beef bits and fragrant spiced butter.',
  },
  {
    name: 'Chechebsa (Kita Firfir)',
    category: 'Breakfast & Firfir',
    price: 240.0,
    description:
      'Warm torn pan-baked flatbread lightly sautéed with pure Niter Kibbeh and mild berbere, drizzled with raw Ethiopian honey.',
  },
  {
    name: 'Habesha Buna Ceremony',
    category: 'Desserts & Coffee',
    price: 90.0,
    description:
      'Authentic three-round freshly roasted Ethiopian Sidama organic coffee brewed in a clay Jebena, served with popcorn and aromatic incense.',
  },
  {
    name: 'Tej (Honey Wine)',
    category: 'Traditional Beverages',
    price: 150.0,
    description:
      'Traditional golden fermented honey wine seasoned with Gesho leaves, served chilled in a round Berele glass flask.',
  },
  {
    name: 'Fresh Spris Juice',
    category: 'Traditional Beverages',
    price: 120.0,
    description:
      'Vibrant layers of fresh avocado, sun-ripened mango, and papaya puree with a splash of fresh lime juice and Vimto syrup.',
  },
  {
    name: 'Baklava with Cardamom',
    category: 'Desserts & Coffee',
    price: 140.0,
    description:
      'Crisp layers of delicate filo pastry filled with roasted nuts and fragrant cardamom, bathed in organic honey syrup.',
  },
];

const ingredients = [
  { name: 'Teff Flour', stock: 120.0, minimum: 30.0 },
  { name: 'Berbere (Spiced Chili Pepper)', stock: 45.0, minimum: 10.0 },
  { name: 'Niter Kibbeh (Spiced Butter)', stock: 35.0, minimum: 8.0 },
  { name: 'Prime Beef Cubes', stock: 60.0, minimum: 15.0 },
  { name: 'Country Chicken', stock: 40.0, minimum: 10.0 },
  { name: 'Shiro Powder', stock: 50.0, minimum: 12.0 },
  { name: 'Red Onions', stock: 80.0, minimum: 20.0 },
  { name: 'Garlic & Ginger Mix', stock: 25.0, minimum: 5.0 },
  { name: 'Mitmita (Chili Powder)', stock: 15.0, minimum: 3.0 },
  { name: 'Ayib (Ethiopian Cottage Cheese)', stock: 20.0, minimum: 5.0 },
  { name: 'Organic Sidama Coffee Beans', stock: 30.0, minimum: 8.0 },
  { name: 'Pure Raw Honey', stock: 25.0, minimum: 5.0 },
  { name: 'Red Lentils (Misir)', stock: 40.0, minimum: 10.0 },
  { name: 'Split Peas (Kik)', stock: 35.0, minimum: 10.0 },
];

const tables = [
  { name: 'Table 1 - Lalibela', seats: 4, status: TableStatus.OCCUPIED },
  { name: 'Table 2 - Axum', seats: 6, status: TableStatus.OCCUPIED },
  { name: 'Table 3 - Gondar', seats: 4, status: TableStatus.FREE },
  { name: 'Table 4 - Harar', seats: 2, status: TableStatus.FREE },
  { name: 'Table 5 - Semien', seats: 8, status: TableStatus.FREE },
  { name: 'Table 6 - Bale', seats: 4, status: TableStatus.RESERVED },
  { name: 'Table 7 - Tiya', seats: 2, status: TableStatus.FREE },
  { name: 'Table 8 - Abijatta', seats: 6, status: TableStatus.FREE },
];

async function main() {
  console.log('🇪🇹 Seeding Ethiopian restaurant database...');

  const password = await hash('password123', 10);

  // Clean up legacy placeholder food and categories if not in orders
  const oldFoods = [
    'Margherita Pizza',
    'Pepperoni Pizza',
    'Chicken Burger',
    'Caesar Salad',
    'French Fries',
    'Iced Coffee',
    'Chocolate Cake',
    'Orange Juice',
  ];
  for (const name of oldFoods) {
    try {
      await prisma.food.delete({ where: { name } });
    } catch {
      /* ignore if used in order or doesn't exist */
    }
  }
  const oldCats = ['Pizza', 'Burger', 'Salad', 'Drinks', 'Desserts', 'Sides'];
  for (const name of oldCats) {
    try {
      await prisma.category.delete({ where: { name } });
    } catch {
      /* ignore */
    }
  }

  // 1. Settings
  console.log('-> Seeding Settings...');
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {
      name: 'Habesha Cultural Restaurant',
      phone: '+251 11 661 5432',
      address: 'Namibia St, Bole, Addis Ababa, Ethiopia',
      currency: 'ETB',
      taxRate: 15,
      deliveryFee: 100,
      dineInEnabled: true,
      takeawayEnabled: true,
      deliveryEnabled: true,
      cashEnabled: true,
      cardEnabled: true,
      mobileEnabled: true,
      lowStockMinimum: 5,
    },
    create: {
      id: 'default',
      name: 'Habesha Cultural Restaurant',
      phone: '+251 11 661 5432',
      address: 'Namibia St, Bole, Addis Ababa, Ethiopia',
      currency: 'ETB',
      taxRate: 15,
      deliveryFee: 100,
      dineInEnabled: true,
      takeawayEnabled: true,
      deliveryEnabled: true,
      cashEnabled: true,
      cardEnabled: true,
      mobileEnabled: true,
      lowStockMinimum: 5,
    },
  });

  // 2. Users
  console.log('-> Seeding Users...');
  const userMap = new Map<string, string>();
  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        role: user.role,
        password,
      },
      create: { ...user, password },
    });
    userMap.set(user.email, record.id);
  }

  // 3. Categories
  console.log('-> Seeding Categories...');
  const categoryIds = new Map<string, string>();
  for (const name of categories) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryIds.set(name, category.id);
  }

  // 4. Foods
  console.log('-> Seeding Foods...');
  const foodMap = new Map<string, { id: string; price: number; name: string }>();
  for (const { category, ...food } of foods) {
    const catId = categoryIds.get(category);
    if (!catId) continue;
    const record = await prisma.food.upsert({
      where: { name: food.name },
      update: {
        price: food.price,
        description: food.description,
        categoryId: catId,
        isAvailable: true,
      },
      create: {
        ...food,
        categoryId: catId,
        isAvailable: true,
      },
    });
    foodMap.set(food.name, {
      id: record.id,
      price: Number(record.price),
      name: record.name,
    });
  }

  // 5. Ingredients
  console.log('-> Seeding Ingredients...');
  const ingredientMap = new Map<string, string>();
  for (const item of ingredients) {
    const record = await prisma.ingredient.upsert({
      where: { name: item.name },
      update: { stock: item.stock, minimum: item.minimum },
      create: { name: item.name, stock: item.stock, minimum: item.minimum },
    });
    ingredientMap.set(item.name, record.id);
  }

  // 6. Recipes
  console.log('-> Seeding Recipes...');
  const recipeDefinitions: Array<{
    foodName: string;
    lines: Array<{ ingredientName: string; quantity: number }>;
  }> = [
    {
      foodName: 'Special Beef Tibs',
      lines: [
        { ingredientName: 'Prime Beef Cubes', quantity: 0.35 },
        { ingredientName: 'Niter Kibbeh (Spiced Butter)', quantity: 0.05 },
        { ingredientName: 'Red Onions', quantity: 0.1 },
        { ingredientName: 'Garlic & Ginger Mix', quantity: 0.02 },
      ],
    },
    {
      foodName: 'Doro Wot (Special Feast)',
      lines: [
        { ingredientName: 'Country Chicken', quantity: 0.4 },
        { ingredientName: 'Berbere (Spiced Chili Pepper)', quantity: 0.08 },
        { ingredientName: 'Niter Kibbeh (Spiced Butter)', quantity: 0.06 },
        { ingredientName: 'Red Onions', quantity: 0.15 },
        { ingredientName: 'Garlic & Ginger Mix', quantity: 0.03 },
      ],
    },
    {
      foodName: 'Kitfo Special',
      lines: [
        { ingredientName: 'Prime Beef Cubes', quantity: 0.35 },
        { ingredientName: 'Niter Kibbeh (Spiced Butter)', quantity: 0.08 },
        { ingredientName: 'Mitmita (Chili Powder)', quantity: 0.03 },
        { ingredientName: 'Ayib (Ethiopian Cottage Cheese)', quantity: 0.05 },
      ],
    },
    {
      foodName: 'Shiro Tegabino',
      lines: [
        { ingredientName: 'Shiro Powder', quantity: 0.15 },
        { ingredientName: 'Niter Kibbeh (Spiced Butter)', quantity: 0.04 },
        { ingredientName: 'Red Onions', quantity: 0.08 },
        { ingredientName: 'Garlic & Ginger Mix', quantity: 0.02 },
      ],
    },
    {
      foodName: 'Habesha Buna Ceremony',
      lines: [
        { ingredientName: 'Organic Sidama Coffee Beans', quantity: 0.05 },
      ],
    },
    {
      foodName: 'Tej (Honey Wine)',
      lines: [{ ingredientName: 'Pure Raw Honey', quantity: 0.1 }],
    },
  ];

  for (const def of recipeDefinitions) {
    const food = foodMap.get(def.foodName);
    if (!food) continue;
    for (const line of def.lines) {
      const ingId = ingredientMap.get(line.ingredientName);
      if (!ingId) continue;
      await prisma.recipeLine.upsert({
        where: {
          foodId_ingredientId: {
            foodId: food.id,
            ingredientId: ingId,
          },
        },
        update: { quantity: line.quantity },
        create: {
          foodId: food.id,
          ingredientId: ingId,
          quantity: line.quantity,
        },
      });
    }
  }

  // 7. Tables
  console.log('-> Seeding Tables...');
  const tableMap = new Map<string, string>();
  for (const t of tables) {
    const record = await prisma.restaurantTable.upsert({
      where: { name: t.name },
      update: { seats: t.seats, status: t.status },
      create: { name: t.name, seats: t.seats, status: t.status },
    });
    tableMap.set(t.name, record.id);
  }

  // 8. Sample Ethiopian Orders & Payments
  console.log('-> Seeding Orders & Payments...');
  const customerId = userMap.get('dawit@email.com') ?? userMap.get('john@email.com');
  const customer2Id = userMap.get('selam@email.com') ?? customerId;
  const adminId = userMap.get('admin@habesha.com') ?? userMap.get('admin@restro.com');

  if (customerId && customer2Id) {
    const tibs = foodMap.get('Special Beef Tibs');
    const doro = foodMap.get('Doro Wot (Special Feast)');
    const buna = foodMap.get('Habesha Buna Ceremony');
    const shiro = foodMap.get('Shiro Tegabino');
    const spris = foodMap.get('Fresh Spris Juice');

    // Check if we already have orders seeded
    const existingOrdersCount = await prisma.order.count();
    if (existingOrdersCount < 3) {
      // Order 1: Completed dine-in with receipt
      if (tibs && buna) {
        const subtotal = tibs.price + buna.price * 2;
        const tax = Math.round(subtotal * 0.15 * 100) / 100;
        const total = subtotal + tax;

        const tableId = tableMap.get('Table 1 - Lalibela');
        const order1 = await prisma.order.create({
          data: {
            customerId,
            type: OrderType.DINE_IN,
            status: OrderStatus.COMPLETED,
            tableId,
            tableLabel: 'Table 1 - Lalibela',
            subtotal,
            tax,
            deliveryFee: 0,
            total,
            stockAdjusted: true,
            items: {
              create: [
                {
                  foodId: tibs.id,
                  name: tibs.name,
                  unitPrice: tibs.price,
                  quantity: 1,
                },
                {
                  foodId: buna.id,
                  name: buna.name,
                  unitPrice: buna.price,
                  quantity: 2,
                },
              ],
            },
            payment: {
              create: {
                receipt: 'R-101',
                amount: total,
                method: PaymentMethod.CASH,
                paid: true,
                recordedById: adminId,
              },
            },
          },
        });
        console.log(`Created order: ORD-${order1.number}`);
      }

      // Order 2: Preparing dine-in at Table 2
      if (doro && spris) {
        const subtotal = doro.price + spris.price * 2;
        const tax = Math.round(subtotal * 0.15 * 100) / 100;
        const total = subtotal + tax;
        const tableId = tableMap.get('Table 2 - Axum');

        const order2 = await prisma.order.create({
          data: {
            customerId: customer2Id,
            type: OrderType.DINE_IN,
            status: OrderStatus.PREPARING,
            tableId,
            tableLabel: 'Table 2 - Axum',
            subtotal,
            tax,
            deliveryFee: 0,
            total,
            stockAdjusted: true,
            items: {
              create: [
                {
                  foodId: doro.id,
                  name: doro.name,
                  unitPrice: doro.price,
                  quantity: 1,
                },
                {
                  foodId: spris.id,
                  name: spris.name,
                  unitPrice: spris.price,
                  quantity: 2,
                },
              ],
            },
            payment: {
              create: {
                receipt: 'R-102',
                amount: total,
                method: PaymentMethod.MOBILE,
                paid: true,
                recordedById: adminId,
              },
            },
          },
        });
        console.log(`Created order: ORD-${order2.number}`);
      }

      // Order 3: Pending Delivery Order
      if (shiro && tibs) {
        const subtotal = shiro.price * 2 + tibs.price;
        const deliveryFee = 100.0;
        const tax = Math.round(subtotal * 0.15 * 100) / 100;
        const total = subtotal + tax + deliveryFee;

        const order3 = await prisma.order.create({
          data: {
            customerId,
            type: OrderType.DELIVERY,
            status: OrderStatus.PENDING,
            subtotal,
            tax,
            deliveryFee,
            total,
            stockAdjusted: true,
            items: {
              create: [
                {
                  foodId: shiro.id,
                  name: shiro.name,
                  unitPrice: shiro.price,
                  quantity: 2,
                },
                {
                  foodId: tibs.id,
                  name: tibs.name,
                  unitPrice: tibs.price,
                  quantity: 1,
                },
              ],
            },
            payment: {
              create: {
                amount: total,
                method: PaymentMethod.CASH,
                paid: false,
              },
            },
          },
        });
        console.log(`Created order: ORD-${order3.number}`);
      }
    }
  }

  console.log('✅ Ethiopian database seeding finished successfully!');
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
