require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// pg driver tidak kenal ?pgbouncer=true — strip parameter tersebut
const rawUrl = process.env.DATABASE_URL || '';
const connectionString = rawUrl.replace('?pgbouncer=true', '').replace('&pgbouncer=true', '');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
