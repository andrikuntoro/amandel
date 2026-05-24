const router = require('express').Router();

const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { awardPoints } = require('../services/points.service');
const { sendMail, templates } = require('../services/email.service');

const prisma = require('../lib/prisma');

// GET /api/users (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, employeeId: true, department: true, phone: true, role: true, tier: true, totalPoints: true, status: true, createdAt: true },
      orderBy: { totalPoints: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, employeeId: true, department: true, phone: true, avatar: true, role: true, tier: true, totalPoints: true, status: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const matchCount = await prisma.matchPlayer.count({ where: { userId: user.id } });
    const winCount = await prisma.matchPlayer.count({ where: { userId: user.id, points: { gte: 10 } } });
    const pointLogs = await prisma.pointLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 10 });

    res.json({ user, stats: { matchCount, winCount, pointLogs } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ error: 'Tidak diizinkan' });

    const { name, department, phone, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, department, phone, avatar },
      select: { id: true, name: true, email: true, department: true, phone: true, avatar: true, tier: true, totalPoints: true },
    });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id/status (admin)
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING'].includes(status))
      return res.status(400).json({ error: 'Status tidak valid' });

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status },
    });

    // Award referral points to whoever invited them when first approved
    if (status === 'ACTIVE' && user.joinedVia === 'invite_code' && user.inviteCode) {
      // simple: find a referrer isn't tracked per-user here, skip referral bonus
    }

    if (status === 'ACTIVE') {
      sendMail(user.email, templates.welcome(user));
    }

    res.json({ user: { id: user.id, status: user.status } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
