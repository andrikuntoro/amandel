require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPass = await bcrypt.hash('Admin123!', 12);
  const memberPass = await bcrypt.hash('Member123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@axamandiri.co.id' },
    update: {},
    create: {
      name: 'Fitri Andriani',
      email: 'admin@axamandiri.co.id',
      employeeId: 'AXA-0001',
      password: adminPass,
      department: 'Actuarial',
      role: 'ADMIN',
      tier: 'DIAMOND',
      totalPoints: 1840,
      status: 'ACTIVE',
    },
  });

  const members = [
    { name: 'Sari Dewi',     email: 'sari.d@axamandiri.co.id',   employeeId: 'AXA-0002', dept: 'Finance',      tier: 'DIAMOND', pts: 1720 },
    { name: 'Rizky Pratama', email: 'rizky.p@axamandiri.co.id',  employeeId: 'AXA-0003', dept: 'Underwriting', tier: 'GOLD',    pts: 1240 },
    { name: 'Denny Wijaya',  email: 'denny.w@axamandiri.co.id',  employeeId: 'AXA-0004', dept: 'Sales',        tier: 'GOLD',    pts: 1180 },
    { name: 'Hendra Lim',    email: 'hendra.l@axamandiri.co.id', employeeId: 'AXA-0005', dept: 'Legal',        tier: 'GOLD',    pts: 1050 },
    { name: 'Budi Santoso',  email: 'budi.s@axamandiri.co.id',   employeeId: 'AXA-0006', dept: 'IT',           tier: 'SILVER',  pts: 720  },
    { name: 'Maya Putri',    email: 'maya.p@axamandiri.co.id',   employeeId: 'AXA-0007', dept: 'Marketing',    tier: 'SILVER',  pts: 650  },
    { name: 'Anita Kusuma',  email: 'anita.k@axamandiri.co.id',  employeeId: 'AXA-0008', dept: 'HR',           tier: 'BRONZE',  pts: 420  },
    { name: 'Eko Prasetyo',  email: 'eko.p@axamandiri.co.id',    employeeId: 'AXA-0009', dept: 'Operations',   tier: 'BRONZE',  pts: 310  },
    { name: 'Laila Nuraini', email: 'laila.n@axamandiri.co.id',  employeeId: 'AXA-0010', dept: 'Compliance',   tier: 'BRONZE',  pts: 255  },
  ];

  for (const m of members) {
    await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        name: m.name,
        email: m.email,
        employeeId: m.employeeId,
        password: memberPass,
        department: m.dept,
        role: 'MEMBER',
        tier: m.tier,
        totalPoints: m.pts,
        status: 'ACTIVE',
      },
    });
  }

  const rewards = [
    { name: 'Overgrip Premium',       description: 'Wilson Pro Overgrip 3-pack',                         pointCost: 50,  stock: 20, category: 'Equipment' },
    { name: 'Kaos AMANDEL',           description: 'Kaos komunitas eksklusif edisi terbatas',             pointCost: 100, stock: 8,  category: 'Apparel'   },
    { name: 'Private Coaching 1hr',   description: 'Sesi 1-on-1 dengan coach bersertifikat WPT',         pointCost: 150, stock: 5,  category: 'Training'  },
    { name: 'Court Booking 2 Jam',    description: 'Gratis booking court untuk 4 pemain',                 pointCost: 200, stock: 10, category: 'Booking'   },
    { name: 'Raket Adidas RX',        description: 'Raket padel Adidas RX Series full carbon',           pointCost: 500, stock: 3,  category: 'Equipment' },
    { name: 'Makan Siang + Direksi',  description: 'Lunch eksklusif bersama Direksi AXA Mandiri',        pointCost: 750, stock: 2,  category: 'Exclusive' },
  ];

  for (const r of rewards) {
    const exists = await prisma.reward.findFirst({ where: { name: r.name } });
    if (!exists) await prisma.reward.create({ data: r });
  }

  console.log('✅ Seed selesai!');
  console.log('Admin: admin@axamandiri.co.id / Admin123!');
  console.log('Member: sari.d@axamandiri.co.id / Member123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
