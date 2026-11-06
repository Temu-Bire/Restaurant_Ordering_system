import {PrismaClient, Role, } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
    const password= await bcrypt.hash('admin123@', 10);
    await prisma.user.upsert({
        where: { email: 'admin@restaurant.com' },
        update: {},
        create:{
            fullName: 'System Admin',
            email: 'admin@restaurant.com',
            password: password,
            role: Role.ADMIN        
        }
    });
    const staffPassword= await bcrypt.hash('staff123@', 10);
    await prisma.user.upsert({
        where: { email: 'staff@restaurant.com' },
        update: {},
        create:{
            fullName: 'Staff User',
            email: 'staff@restaurant.com',
            password: staffPassword,
            role: Role.STAFF
        }
    });
    const customerPassword= await bcrypt.hash('customer123@', 10);
    await prisma.user.upsert({
        where: { email: 'customer@restaurant.com' },
        update: {},
        create:{
            fullName: 'Customer User',
            email: 'customer@restaurant.com',
            password: customerPassword,
            role: Role.CUSTOMER
        }
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    }).finally(() => {
        prisma.$disconnect();
    });