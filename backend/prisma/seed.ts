import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { role: 'ADMIN', password: adminPassword },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: adminPassword,
      fullName: 'Admin',
      role: 'ADMIN',
      isVerified: true,
      bio: 'Platform administrator',
    },
  });
  console.log('✅ Admin:', admin.email);

  // ── Photographer ───────────────────────────────────────────────────────────
  const photographerPassword = await bcrypt.hash('photo123', 12);
  const photographer = await prisma.user.upsert({
    where: { email: 'photographer@example.com' },
    update: {},
    create: {
      email: 'photographer@example.com',
      username: 'photographer',
      password: photographerPassword,
      fullName: 'Jane Photographer',
      role: 'PHOTOGRAPHER',
      isVerified: true,
      bio: 'Club photographer',
    },
  });

  // ── Club Member ────────────────────────────────────────────────────────────
  const memberPassword = await bcrypt.hash('member123', 12);
  const clubMember = await prisma.user.upsert({
    where: { email: 'club_m@example.com' },
    update: {},
    create: {
      email: 'club_m@example.com',
      username: 'club_m',
      password: memberPassword,
      fullName: 'Club Member',
      role: 'CLUB_MEMBER',
      isVerified: true,
    },
  });

  // ── Viewer ─────────────────────────────────────────────────────────────────
  const viewerPassword = await bcrypt.hash('viewer123', 12);
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: {
      email: 'viewer@example.com',
      username: 'viewer',
      password: viewerPassword,
      fullName: 'Viewer User',
      role: 'VIEWER',
      isVerified: true,
    },
  });

  // ── Sample Events ──────────────────────────────────────────────────────────
  await prisma.event.upsert({
    where: { slug: 'annual-photography-workshop-2024' },
    update: {},
    create: {
      name: 'Annual Photography Workshop 2024',
      slug: 'annual-photography-workshop-2024',
      description: 'Learn advanced photography techniques from industry experts',
      category: 'WORKSHOP',
      accessLevel: 'PUBLIC',
      startDate: new Date('2024-03-15T10:00:00Z'),
      endDate: new Date('2024-03-15T17:00:00Z'),
      location: 'Main Auditorium',
      clubName: 'Photography Club',
      createdById: admin.id,
    },
  });

  await prisma.event.upsert({
    where: { slug: 'spring-cultural-fest-2024' },
    update: {},
    create: {
      name: 'Spring Cultural Fest 2024',
      slug: 'spring-cultural-fest-2024',
      description: 'Annual cultural celebration featuring art, music, and dance',
      category: 'CULTURAL_FEST',
      accessLevel: 'PUBLIC',
      startDate: new Date('2024-04-01T09:00:00Z'),
      endDate: new Date('2024-04-03T21:00:00Z'),
      location: 'Campus Grounds',
      clubName: 'Cultural Committee',
      createdById: photographer.id,
    },
  });

  await prisma.event.upsert({
    where: { slug: 'photography-club-trip' },
    update: {},
    create: {
      name: 'Photography Club Trip',
      slug: 'photography-club-trip',
      description: 'Weekend trip for landscape photography',
      category: 'TRIP',
      accessLevel: 'CLUB_ONLY',
      startDate: new Date('2024-05-10T06:00:00Z'),
      endDate: new Date('2024-05-12T18:00:00Z'),
      location: 'Hill Station',
      clubName: 'Photography Club',
      createdById: photographer.id,
    },
  });

  // ── Tags ───────────────────────────────────────────────────────────────────
  const tagNames = ['Nature', 'Portrait', 'Landscape', 'Event', 'Group Photo', 'Sports', 'Cultural', 'Workshop'];
  await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { slug: name.toLowerCase().replace(/\s+/g, '-') },
        update: {},
        create: {
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
        },
      })
    )
  );

  console.log('\n✅ Seed completed!');
  console.log('──────────────────────────────────────');
  console.log('ADMIN:        admin@example.com         / admin123');
  console.log('PHOTOGRAPHER: photographer@example.com  / photo123');
  console.log('CLUB_MEMBER:  club_m@example.com        / member123');
  console.log('VIEWER:       viewer@example.com        / viewer123');
  console.log('──────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
