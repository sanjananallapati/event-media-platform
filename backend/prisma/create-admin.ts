/**
 * One-off script to create or promote a user to ADMIN.
 * Usage:
 *   npx ts-node prisma/create-admin.ts
 *   EMAIL=you@example.com PASSWORD=secret123 npx ts-node prisma/create-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.EMAIL || 'admin@example.com';
  const password = process.env.PASSWORD || 'admin123';
  const username = process.env.USERNAME || 'admin';
  const fullName = process.env.FULL_NAME || 'Admin';

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', password: hashed, isActive: true },
    create: {
      email,
      username,
      password: hashed,
      fullName,
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
    select: { id: true, email: true, username: true, role: true },
  });

  console.log('✅ Admin account ready:', user);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
