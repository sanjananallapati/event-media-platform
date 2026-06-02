import { PrismaClient, UserRole, EventCategory, AccessLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eventmedia.com' },
    update: {},
    create: {
      email: 'admin@eventmedia.com',
      username: 'admin',
      password: adminPassword,
      fullName: 'System Admin',
      role: 'ADMIN',
      isVerified: true,
      bio: 'Platform administrator',
    },
  });

  // Create photographer user
  const photographerPassword = await bcrypt.hash('photo123', 12);
  const photographer = await prisma.user.upsert({
    where: { email: 'photographer@eventmedia.com' },
    update: {},
    create: {
      email: 'photographer@eventmedia.com',
      username: 'photographer',
      password: photographerPassword,
      fullName: 'John Photographer',
      role: 'PHOTOGRAPHER',
      isVerified: true,
      bio: 'Club photographer',
    },
  });

  // Create club member user
  const memberPassword = await bcrypt.hash('member123', 12);
  const member = await prisma.user.upsert({
    where: { email: 'member@eventmedia.com' },
    update: {},
    create: {
      email: 'member@eventmedia.com',
      username: 'clubmember',
      password: memberPassword,
      fullName: 'Jane Member',
      role: 'CLUB_MEMBER',
      isVerified: true,
      bio: 'Active club member',
    },
  });

  // Create viewer user
  const viewerPassword = await bcrypt.hash('viewer123', 12);
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@eventmedia.com' },
    update: {},
    create: {
      email: 'viewer@eventmedia.com',
      username: 'viewer',
      password: viewerPassword,
      fullName: 'Bob Viewer',
      role: 'VIEWER',
      isVerified: true,
      bio: 'Just browsing',
    },
  });

  // Create sample events
  const events = await Promise.all([
    prisma.event.upsert({
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
    }),
    prisma.event.upsert({
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
    }),
    prisma.event.upsert({
      where: { slug: 'photography-club-trip' },
      update: {},
      create: {
        name: 'Photography Club Trip',
        slug: 'photography-club-trip',
        description: 'Weekend trip to scenic locations for landscape photography',
        category: 'TRIP',
        accessLevel: 'CLUB_ONLY',
        startDate: new Date('2024-05-10T06:00:00Z'),
        endDate: new Date('2024-05-12T18:00:00Z'),
        location: 'Hill Station',
        clubName: 'Photography Club',
        createdById: photographer.id,
      },
    }),
  ]);

  // Create sample tags
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

  console.log('✅ Seed completed!');
  console.log('Admin login: admin@eventmedia.com / admin123');
  console.log('Photographer login: photographer@eventmedia.com / photo123');
  console.log('Member login: member@eventmedia.com / member123');
  console.log('Viewer login: viewer@eventmedia.com / viewer123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
