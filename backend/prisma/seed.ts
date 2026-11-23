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

const DEFAULT_DISH_IMAGE = '/uploads/menu/default-dish.png';

const users = [
  {
    fullName: 'አበበ ቢቂላ (Abebe Bikila)',
    email: 'admin@habesha.com',
    phone: '+251 911 223344',
    address: 'Bole Sub-City, Addis Ababa',
    role: Role.ADMIN,
  },
  {
    fullName: 'አድሚን አበበ (Admin Abebe)',
    email: 'admin@restro.com',
    phone: '+251 911 223344',
    address: 'Bole Sub-City, Addis Ababa',
    role: Role.ADMIN,
  },
  {
    fullName: 'አልማዝ አያና (Almaz Ayana)',
    email: 'staff@habesha.com',
    phone: '+251 922 334455',
    address: 'Kazanchis, Kirkos, Addis Ababa',
    role: Role.STAFF,
  },
  {
    fullName: 'ሳራ ተስፋዬ (Sara Tesfaye)',
    email: 'sara@restro.com',
    phone: '+251 922 334456',
    address: 'Piassa, Arada, Addis Ababa',
    role: Role.STAFF,
  },
  {
    fullName: 'ዳዊት ከበደ (Dawit Kebede)',
    email: 'dawit@email.com',
    phone: '+251 933 445566',
    address: 'Sarbet, Old Airport, Addis Ababa',
    role: Role.CUSTOMER,
  },
  {
    fullName: 'ሰላማዊት ደስታ (Selamawit Desta)',
    email: 'selam@email.com',
    phone: '+251 944 556677',
    address: 'CMC, Yeka, Addis Ababa',
    role: Role.CUSTOMER,
  },
  {
    fullName: 'ዮሐንስ ዶ (John Doe)',
    email: 'john@email.com',
    phone: '+251 955 667788',
    address: 'Meskel Square, Addis Ababa',
    role: Role.CUSTOMER,
  },
];

const categoryDefs = [
  {
    oldName: 'Tibs (Meat Dishes)',
    name: 'ልዩ ጥብስ / Tibs (Meat Dishes)',
  },
  {
    oldName: 'Wot & Stews',
    name: 'ወጥ እና አልጫ / Wot & Stews',
  },
  {
    oldName: 'Fasting & Vegetarian',
    name: 'የጾም በያይነቱ / Fasting & Vegetarian',
  },
  {
    oldName: 'Breakfast & Firfir',
    name: 'ቁርስ እና ፍርፍር / Breakfast & Firfir',
  },
  {
    oldName: 'Traditional Beverages',
    name: 'ባህላዊ መጠጦች / Traditional Beverages',
  },
  {
    oldName: 'Desserts & Coffee',
    name: 'ጣፋጭ እና ቡና / Desserts & Coffee',
  },
];

const foodDefs = [
  {
    oldName: 'Special Beef Tibs',
    name: 'ልዩ የበሬ ጥብስ / Special Beef Tibs',
    category: 'ልዩ ጥብስ / Tibs (Meat Dishes)',
    price: 480.0,
    description:
      'የተመረጠ የበሬ ስጋ በቅቤ፣ ሮዝመሪ እና ቃሪያ ተጠብሶ ከትኩስ ጤፍ እንጀራ ጋር የቀረበ። (Tender beef cubes sauteed with spiced butter, rosemary, and jalapeños served with warm Teff Injera.)',
  },
  {
    oldName: 'Shekla Tibs',
    name: 'የሸክላ ጥብስ / Shekla Tibs',
    category: 'ልዩ ጥብስ / Tibs (Meat Dishes)',
    price: 520.0,
    description:
      'በከሰል የጋለ የሸክላ ምጣድ ላይ የተጠበሰ ስጋ ከአዋዜና ሚጥሚጣ ጋር። (Sizzling marinated beef served on a traditional clay pot over glowing hot charcoal, with awaze and mitmita.)',
  },
  {
    oldName: 'Doro Wot (Special Feast)',
    name: 'የበዓል ዶሮ ወጥ / Doro Wot (Special Feast)',
    category: 'ወጥ እና አልጫ / Wot & Stews',
    price: 580.0,
    description:
      'በደቀቀ ሽንኩርት እና በርበሬ የተቁላላ የሀበሻ የዶሮ ወጥ ከእንቁላልና አይብ ጋር። (Celebratory chicken slow-simmered in rich berbere sauce with hard-boiled egg and fresh Ayib.)',
  },
  {
    oldName: 'Kitfo Special',
    name: 'ልዩ ክትፎ / Special Kitfo',
    category: 'ወጥ እና አልጫ / Wot & Stews',
    price: 550.0,
    description:
      'የተመረጠ ቀይ ስጋ በሚጥሚጣና በተነጠረ አንጥረኛ ቅቤ ተለውሶ ከጎመን፣ አይብና ቆጮ ጋር። (Minced prime lean beef seasoned with warm clarified spiced butter, mitmita, served with Gomen, Ayib, and Kocho.)',
  },
  {
    oldName: 'Shiro Tegabino',
    name: 'ተጋቢኖ ሽሮ / Shiro Tegabino',
    category: 'የጾም በያይነቱ / Fasting & Vegetarian',
    price: 260.0,
    description:
      'በሸክላ ድስት እየተንተከተከ የሚቀርብ መዓዛው ልዩ የሆነ የሽሮ ወጥ ከእንጀራ ጋር። (Simmering spiced chickpea flour stew served bubbling hot in a traditional clay pot with fresh Teff Injera.)',
  },
  {
    oldName: 'Beyeaynetu (Fasting Platter)',
    name: 'የጾም በያይነቱ / Beyeaynetu (Fasting Platter)',
    category: 'የጾም በያይነቱ / Fasting & Vegetarian',
    price: 320.0,
    description:
      'የተለያዩ የጾም ወጦች ክምችት፡ ምስር፣ ክክ፣ አትክልት፣ ጎመን፣ ዲንሽ እና ሰላጣ። (Traditional colorful vegan combination feast: Misir Wot, Kik Alicha, Gomen, Atkilt, Fosolia, and Beetroot over Injera.)',
  },
  {
    oldName: 'Special Beef Firfir',
    name: 'ልዩ የበሬ ፍርፍር / Special Beef Firfir',
    category: 'ቁርስ እና ፍርፍር / Breakfast & Firfir',
    price: 290.0,
    description:
      'የተቆራረጠ ለስላሳ እንጀራ በበሬ ስጋና በርበሬ ተለውሶ በቅቤ የቀረበ። (Shredded injera pieces tossed in flavorful spicy berbere sauce enriched with tender beef bits and fragrant spiced butter.)',
  },
  {
    oldName: 'Chechebsa (Kita Firfir)',
    name: 'ጨጨብሳ በቅቤና ማር / Chechebsa with Honey',
    category: 'ቁርስ እና ፍርፍር / Breakfast & Firfir',
    price: 240.0,
    description:
      'የተቆራረሰ የቂጣ ቁርስ በቅቤና በርበሬ ተለውሶ ከንጹህ የተፈጥሮ ማር ጋር። (Warm torn pan-baked flatbread lightly sautéed with pure Niter Kibbeh and mild berbere, drizzled with raw Ethiopian honey.)',
  },
  {
    oldName: 'Habesha Buna Ceremony',
    name: 'የሀበሻ ጀበና ቡና / Habesha Buna Ceremony',
    category: 'ጣፋጭ እና ቡና / Desserts & Coffee',
    price: 90.0,
    description:
      'በትኩስ ጀበና የተፈላ የሲዳማ ቡና ከፈንዲሻ እና እጣን ጋር። (Authentic freshly roasted Ethiopian Sidama organic coffee brewed in a clay Jebena, served with popcorn and aromatic incense.)',
  },
  {
    oldName: 'Tej (Honey Wine)',
    name: 'የጠጅ መጠጥ / Tej (Honey Wine)',
    category: 'ባህላዊ መጠጦች / Traditional Beverages',
    price: 150.0,
    description:
      'ከንጹህ ማርና ጌሾ የተዘጋጀ ባህላዊ መጠጥ በበረሌ የቀረበ። (Traditional golden fermented honey wine seasoned with Gesho leaves, served chilled in a round Berele glass flask.)',
  },
  {
    oldName: 'Fresh Spris Juice',
    name: 'ትኩስ እስፕሪስ ጁስ / Fresh Spris Juice',
    category: 'ባህላዊ መጠጦች / Traditional Beverages',
    price: 120.0,
    description:
      'አቮካዶ፣ ማንጎ እና ፓፓያ በንብርብር የተዘጋጀ ትኩስ የተፈጥሮ ጭማቂ። (Vibrant layers of fresh avocado, sun-ripened mango, and papaya puree with a splash of fresh lime juice.)',
  },
  {
    oldName: 'Baklava with Cardamom',
    name: 'ባቅላቫ በቅመም / Cardamom Baklava',
    category: 'ጣፋጭ እና ቡና / Desserts & Coffee',
    price: 140.0,
    description:
      'በጥራጥሬዎችና ሄል የተዘጋጀ ጣፋጭ ኬክ በማር ሽሮፕ የተነከረ። (Crisp layers of delicate filo pastry filled with roasted nuts and fragrant cardamom, bathed in organic honey syrup.)',
  },
];

const ingredientDefs = [
  { oldName: 'Teff Flour', name: 'የጤፍ ዱቄት / Teff Flour', stock: 120.0, minimum: 30.0 },
  { oldName: 'Berbere (Spiced Chili Pepper)', name: 'የበርበሬ ድልህ / Berbere', stock: 45.0, minimum: 10.0 },
  { oldName: 'Niter Kibbeh (Spiced Butter)', name: 'የተነጠረ ቅቤ / Niter Kibbeh', stock: 35.0, minimum: 8.0 },
  { oldName: 'Prime Beef Cubes', name: 'የበሬ ስጋ / Prime Beef Cubes', stock: 60.0, minimum: 15.0 },
  { oldName: 'Country Chicken', name: 'የሀገር ቤት ዶሮ / Country Chicken', stock: 40.0, minimum: 10.0 },
  { oldName: 'Shiro Powder', name: 'የሽሮ ዱቄት / Shiro Powder', stock: 50.0, minimum: 12.0 },
  { oldName: 'Red Onions', name: 'ቀይ ሽንኩርት / Red Onions', stock: 80.0, minimum: 20.0 },
  { oldName: 'Garlic & Ginger Mix', name: 'ነጭ ሽንኩርትና ዝንጅብል / Garlic & Ginger', stock: 25.0, minimum: 5.0 },
  { oldName: 'Mitmita (Chili Powder)', name: 'የሚጥሚጣ ዱቄት / Mitmita', stock: 15.0, minimum: 3.0 },
  { oldName: 'Ayib (Ethiopian Cottage Cheese)', name: 'የሀበሻ አይብ / Fresh Ayib', stock: 20.0, minimum: 5.0 },
  { oldName: 'Organic Sidama Coffee Beans', name: 'የሲዳማ ቡና ፍሬ / Sidama Coffee Beans', stock: 30.0, minimum: 8.0 },
  { oldName: 'Pure Raw Honey', name: 'የተፈጥሮ ማር / Pure Raw Honey', stock: 25.0, minimum: 5.0 },
  { oldName: 'Red Lentils (Misir)', name: 'ቀይ ምስር / Red Lentils', stock: 40.0, minimum: 10.0 },
  { oldName: 'Split Peas (Kik)', name: 'የክክ ክምችት / Split Peas', stock: 35.0, minimum: 10.0 },
];

const tableDefs = [
  { oldName: 'Table 1 - Lalibela', name: 'ጠረጴዛ 1 - ላሊበላ (Table 1 - Lalibela)', seats: 4, status: TableStatus.OCCUPIED },
  { oldName: 'Table 2 - Axum', name: 'ጠረጴዛ 2 - አክሱም (Table 2 - Axum)', seats: 6, status: TableStatus.OCCUPIED },
  { oldName: 'Table 3 - Gondar', name: 'ጠረጴዛ 3 - ጎንደር (Table 3 - Gondar)', seats: 4, status: TableStatus.FREE },
  { oldName: 'Table 4 - Harar', name: 'ጠረጴዛ 4 - ሀረር (Table 4 - Harar)', seats: 2, status: TableStatus.FREE },
  { oldName: 'Table 5 - Semien', name: 'ጠረጴዛ 5 - ሰሜን (Table 5 - Semien)', seats: 8, status: TableStatus.FREE },
  { oldName: 'Table 6 - Bale', name: 'ጠረጴዛ 6 - ባሌ (Table 6 - Bale)', seats: 4, status: TableStatus.RESERVED },
  { oldName: 'Table 7 - Tiya', name: 'ጠረጴዛ 7 - ጢያ (Table 7 - Tiya)', seats: 2, status: TableStatus.FREE },
  { oldName: 'Table 8 - Abijatta', name: 'ጠረጴዛ 8 - አቢጃታ (Table 8 - Abijatta)', seats: 6, status: TableStatus.FREE },
];

async function main() {
  console.log('🇪🇹 Seeding bilingual Ethiopian restaurant database...');

  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'password123';
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_DEFAULT_PASSWORD) {
    console.warn('⚠️ WARNING: Using default password in production environment. Set SEED_DEFAULT_PASSWORD!');
  }
  const password = await hash(defaultPassword, 10);

  // 1. Settings
  console.log('-> Seeding Settings...');
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {
      name: 'የሀበሻ ባህላዊ ሬስቶራንት (Habesha Cultural Restaurant)',
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
      name: 'የሀበሻ ባህላዊ ሬስቶራንት (Habesha Cultural Restaurant)',
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

  // 3. Categories (Rename old or create bilingual)
  console.log('-> Seeding Categories...');
  const categoryIds = new Map<string, string>();
  for (const item of categoryDefs) {
    // If old category name exists, rename it
    const existingOld = await prisma.category.findUnique({ where: { name: item.oldName } });
    let categoryRecord;
    if (existingOld) {
      categoryRecord = await prisma.category.update({
        where: { id: existingOld.id },
        data: { name: item.name },
      });
    } else {
      categoryRecord = await prisma.category.upsert({
        where: { name: item.name },
        update: {},
        create: { name: item.name },
      });
    }
    categoryIds.set(item.name, categoryRecord.id);
  }

  // 4. Foods (Rename old or create bilingual, setting default image)
  console.log('-> Seeding Foods with default dish image...');
  const foodMap = new Map<string, { id: string; price: number; name: string }>();
  for (const food of foodDefs) {
    const catId = categoryIds.get(food.category);
    if (!catId) continue;

    // Check if food exists under old name
    const existingOld = await prisma.food.findUnique({ where: { name: food.oldName } });
    let record;
    if (existingOld) {
      record = await prisma.food.update({
        where: { id: existingOld.id },
        data: {
          name: food.name,
          price: food.price,
          description: food.description,
          categoryId: catId,
          imagePath: existingOld.imagePath || DEFAULT_DISH_IMAGE,
          isAvailable: true,
        },
      });
    } else {
      record = await prisma.food.upsert({
        where: { name: food.name },
        update: {
          price: food.price,
          description: food.description,
          categoryId: catId,
          imagePath: DEFAULT_DISH_IMAGE,
          isAvailable: true,
        },
        create: {
          name: food.name,
          price: food.price,
          description: food.description,
          categoryId: catId,
          imagePath: DEFAULT_DISH_IMAGE,
          isAvailable: true,
        },
      });
    }
    foodMap.set(food.name, {
      id: record.id,
      price: Number(record.price),
      name: record.name,
    });
  }

  // Ensure all foods have imagePath set
  await prisma.food.updateMany({
    where: { imagePath: null },
    data: { imagePath: DEFAULT_DISH_IMAGE },
  });

  // 5. Ingredients
  console.log('-> Seeding Ingredients...');
  const ingredientMap = new Map<string, string>();
  for (const item of ingredientDefs) {
    const existingOld = await prisma.ingredient.findUnique({ where: { name: item.oldName } });
    let record;
    if (existingOld) {
      record = await prisma.ingredient.update({
        where: { id: existingOld.id },
        data: { name: item.name, stock: item.stock, minimum: item.minimum },
      });
    } else {
      record = await prisma.ingredient.upsert({
        where: { name: item.name },
        update: { stock: item.stock, minimum: item.minimum },
        create: { name: item.name, stock: item.stock, minimum: item.minimum },
      });
    }
    ingredientMap.set(item.name, record.id);
  }

  // 6. Recipes
  console.log('-> Seeding Recipes...');
  const recipeDefinitions: Array<{
    foodName: string;
    lines: Array<{ ingredientName: string; quantity: number }>;
  }> = [
    {
      foodName: 'ልዩ የበሬ ጥብስ / Special Beef Tibs',
      lines: [
        { ingredientName: 'የበሬ ስጋ / Prime Beef Cubes', quantity: 0.35 },
        { ingredientName: 'የተነጠረ ቅቤ / Niter Kibbeh', quantity: 0.05 },
        { ingredientName: 'ቀይ ሽንኩርት / Red Onions', quantity: 0.1 },
        { ingredientName: 'ነጭ ሽንኩርትና ዝንጅብል / Garlic & Ginger', quantity: 0.02 },
      ],
    },
    {
      foodName: 'የበዓል ዶሮ ወጥ / Doro Wot (Special Feast)',
      lines: [
        { ingredientName: 'የሀገር ቤት ዶሮ / Country Chicken', quantity: 0.4 },
        { ingredientName: 'የበርበሬ ድልህ / Berbere', quantity: 0.08 },
        { ingredientName: 'የተነጠረ ቅቤ / Niter Kibbeh', quantity: 0.06 },
        { ingredientName: 'ቀይ ሽንኩርት / Red Onions', quantity: 0.15 },
        { ingredientName: 'ነጭ ሽንኩርትና ዝንጅብል / Garlic & Ginger', quantity: 0.03 },
      ],
    },
    {
      foodName: 'ልዩ ክትፎ / Special Kitfo',
      lines: [
        { ingredientName: 'የበሬ ስጋ / Prime Beef Cubes', quantity: 0.35 },
        { ingredientName: 'የተነጠረ ቅቤ / Niter Kibbeh', quantity: 0.08 },
        { ingredientName: 'የሚጥሚጣ ዱቄት / Mitmita', quantity: 0.03 },
        { ingredientName: 'የሀበሻ አይብ / Fresh Ayib', quantity: 0.05 },
      ],
    },
    {
      foodName: 'ተጋቢኖ ሽሮ / Shiro Tegabino',
      lines: [
        { ingredientName: 'የሽሮ ዱቄት / Shiro Powder', quantity: 0.15 },
        { ingredientName: 'የተነጠረ ቅቤ / Niter Kibbeh', quantity: 0.04 },
        { ingredientName: 'ቀይ ሽንኩርት / Red Onions', quantity: 0.08 },
        { ingredientName: 'ነጭ ሽንኩርትና ዝንጅብል / Garlic & Ginger', quantity: 0.02 },
      ],
    },
    {
      foodName: 'የሀበሻ ጀበና ቡና / Habesha Buna Ceremony',
      lines: [
        { ingredientName: 'የሲዳማ ቡና ፍሬ / Sidama Coffee Beans', quantity: 0.05 },
      ],
    },
    {
      foodName: 'የጠጅ መጠጥ / Tej (Honey Wine)',
      lines: [{ ingredientName: 'የተፈጥሮ ማር / Pure Raw Honey', quantity: 0.1 }],
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
  for (const t of tableDefs) {
    const existingOld = await prisma.restaurantTable.findUnique({ where: { name: t.oldName } });
    let record;
    if (existingOld) {
      record = await prisma.restaurantTable.update({
        where: { id: existingOld.id },
        data: { name: t.name, seats: t.seats, status: t.status },
      });
    } else {
      record = await prisma.restaurantTable.upsert({
        where: { name: t.name },
        update: { seats: t.seats, status: t.status },
        create: { name: t.name, seats: t.seats, status: t.status },
      });
    }
    tableMap.set(t.name, record.id);
  }

  // 8. Orders & Payments
  console.log('-> Checking Orders & Payments...');
  const customerId = userMap.get('dawit@email.com') ?? userMap.get('john@email.com');
  const customer2Id = userMap.get('selam@email.com') ?? customerId;
  const adminId = userMap.get('admin@habesha.com') ?? userMap.get('admin@restro.com');

  if (customerId && customer2Id) {
    const tibs = foodMap.get('ልዩ የበሬ ጥብስ / Special Beef Tibs');
    const doro = foodMap.get('የበዓል ዶሮ ወጥ / Doro Wot (Special Feast)');
    const buna = foodMap.get('የሀበሻ ጀበና ቡና / Habesha Buna Ceremony');
    const shiro = foodMap.get('ተጋቢኖ ሽሮ / Shiro Tegabino');
    const spris = foodMap.get('ትኩስ እስፕሪስ ጁስ / Fresh Spris Juice');

    const existingOrdersCount = await prisma.order.count();
    if (existingOrdersCount < 3) {
      // Order 1: Completed dine-in with receipt
      if (tibs && buna) {
        const subtotal = tibs.price + buna.price * 2;
        const tax = Math.round(subtotal * 0.15 * 100) / 100;
        const total = subtotal + tax;

        const tableId = tableMap.get('ጠረጴዛ 1 - ላሊበላ (Table 1 - Lalibela)');
        const order1 = await prisma.order.create({
          data: {
            customerId,
            type: OrderType.DINE_IN,
            status: OrderStatus.COMPLETED,
            tableId,
            tableLabel: 'ጠረጴዛ 1 - ላሊበላ (Table 1 - Lalibela)',
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
        const tableId = tableMap.get('ጠረጴዛ 2 - አክሱም (Table 2 - Axum)');

        const order2 = await prisma.order.create({
          data: {
            customerId: customer2Id,
            type: OrderType.DINE_IN,
            status: OrderStatus.PREPARING,
            tableId,
            tableLabel: 'ጠረጴዛ 2 - አክሱም (Table 2 - Axum)',
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

  console.log('✅ Ethiopian database seeding finished successfully with bilingual names and default dish images!');
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
