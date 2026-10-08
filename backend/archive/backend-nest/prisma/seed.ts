import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Tender Management database...');

  // ── Seed Users ──────────────────────────────────────────────────
  const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!adminExists) {
    const adminHash = await argon2.hash('admin123');
    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@buildcorp.com',
        passwordHash: adminHash,
        role: 'admin',
      },
    });
    console.log('✅ Admin user created (admin / admin123)');
  }

  const companyExists = await prisma.user.findUnique({ where: { username: 'company' } });
  if (!companyExists) {
    const companyHash = await argon2.hash('company123');
    await prisma.user.create({
      data: {
        username: 'company',
        email: 'manager@buildcorp.com',
        passwordHash: companyHash,
        role: 'company',
      },
    });
    console.log('✅ Company user created (company / company123)');
  }

  // ── Seed Company Profile ────────────────────────────────────────
  const profileExists = await prisma.companyProfile.findFirst();
  if (!profileExists) {
    await prisma.companyProfile.create({
      data: {
        companyName: 'BuildCorp Infrastructure Ltd.',
        turnover: 165.0,
        experienceYears: 12,
        similarProjectsCompleted: 8,
        maxProjectValue: 220.0,
        certifications: 'ISO 9001, ISO 14001, ISO 45001, Class-A Contractor License, GST Registration, PAN',
        equipment:
          '1 segment launcher, 3 batching plants (60 cum/hr), 2 road rollers, 3 dumpers, 2 concrete mixers, 1 concrete pump',
        manpowerCount: 180,
      },
    });
    console.log('✅ Company profile seeded (BuildCorp Infrastructure Ltd.)');
  }

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
