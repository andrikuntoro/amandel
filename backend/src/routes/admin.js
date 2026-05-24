const router = require('express').Router();

const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const prisma = require('../lib/prisma');

// GET /api/admin/stats
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [memberCount, activeMembers, pendingMembers, matchCount, pendingValidate, eventCount, redemptionPending] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { status: 'PENDING' } }),
        prisma.match.count(),
        prisma.match.count({ where: { status: 'PENDING_VALIDATE' } }),
        prisma.event.count({ where: { status: 'ACTIVE' } }),
        prisma.redemption.count({ where: { status: 'PENDING' } }),
      ]);

    const pointsResult = await prisma.pointLog.aggregate({
      where: { points: { gt: 0 } },
      _sum: { points: true },
    });

    res.json({
      stats: {
        memberCount, activeMembers, pendingMembers,
        matchCount, pendingValidate,
        eventCount, redemptionPending,
        totalPointsCirculating: pointsResult._sum.points || 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/activity
router.get('/activity', authenticate, requireAdmin, async (req, res) => {
  try {
    const [recentMatches, recentRedemptions, recentMembers] = await Promise.all([
      prisma.match.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true } } },
      }),
      prisma.redemption.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } }, reward: { select: { name: true } } },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, department: true, status: true, createdAt: true },
      }),
    ]);

    res.json({ recentMatches, recentRedemptions, recentMembers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/broadcast
router.post('/broadcast', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, body, type } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title dan body wajib diisi' });

    const users = await prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
    await prisma.notification.createMany({
      data: users.map(u => ({ userId: u.id, title, body, type: type || 'system' })),
    });

    res.json({ message: `Broadcast terkirim ke ${users.length} member` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/export
router.get('/export', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { name: true, email: true, department: true, tier: true, totalPoints: true, createdAt: true },
      orderBy: { totalPoints: 'desc' },
    });

    const header = 'Name,Email,Department,Tier,Total Points,Joined At';
    const rows = users.map(u =>
      `"${u.name}","${u.email}","${u.department}","${u.tier}",${u.totalPoints},"${u.createdAt.toISOString()}"`
    );
    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="amandel-report.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
