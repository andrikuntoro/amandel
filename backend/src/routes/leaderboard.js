const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const prisma = require('../lib/prisma');

// Upstash Redis (if configured) or ioredis fallback
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else if (process.env.REDIS_URL) {
  const IORedis = require('ioredis');
  try {
    redis = new IORedis(process.env.REDIS_URL, { lazyConnect: true, connectTimeout: 3000 });
    redis.on('error', () => {});
  } catch {}
}

async function cacheGet(key) {
  if (!redis) return null;
  try { return await redis.get(key); } catch { return null; }
}
async function cacheSet(key, value, ttl) {
  if (!redis) return;
  try { await redis.set(key, value, { ex: ttl }); } catch {}
}

// GET /api/leaderboard?period=weekly|monthly|all
router.get('/', authenticate, async (req, res) => {
  try {
    const period = req.query.period || 'all';
    const cacheKey = `leaderboard:${period}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.json(parsed);
    }

    let leaderboard;

    if (period === 'all') {
      const users = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, avatar: true, department: true, tier: true, totalPoints: true },
        orderBy: { totalPoints: 'desc' },
      });
      leaderboard = users.map((u, i) => ({ rank: i + 1, ...u, points: u.totalPoints }));
    } else {
      const days = period === 'weekly' ? 7 : 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const logs = await prisma.pointLog.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: since } },
        _sum: { points: true },
        orderBy: { _sum: { points: 'desc' } },
      });

      const userIds = logs.map(l => l.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds }, status: 'ACTIVE' },
        select: { id: true, name: true, avatar: true, department: true, tier: true },
      });

      const userMap = Object.fromEntries(users.map(u => [u.id, u]));
      leaderboard = logs
        .map((l, i) => ({ rank: i + 1, ...userMap[l.userId], points: l._sum.points || 0 }))
        .filter(l => l.name);
    }

    const payload = { leaderboard };
    await cacheSet(cacheKey, JSON.stringify(payload), 60);
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
