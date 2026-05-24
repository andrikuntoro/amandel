const router = require('express').Router();

const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { sendMail, templates } = require('../services/email.service');
const QRCode = require('qrcode');

const prisma = require('../lib/prisma');

// POST /api/redemptions
router.post('/', authenticate, async (req, res) => {
  try {
    const { rewardId } = req.body;
    if (!rewardId) return res.status(400).json({ error: 'rewardId wajib diisi' });

    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.isActive) return res.status(404).json({ error: 'Reward tidak tersedia' });
    if (reward.stock < 1) return res.status(400).json({ error: 'Stok reward habis' });

    const user = req.user;
    if (user.totalPoints < reward.pointCost)
      return res.status(400).json({ error: `Poin tidak cukup. Kamu butuh ${reward.pointCost} poin.` });

    // Deduct points
    await prisma.user.update({ where: { id: user.id }, data: { totalPoints: { decrement: reward.pointCost } } });
    await prisma.reward.update({ where: { id: rewardId }, data: { stock: { decrement: 1 } } });
    await prisma.pointLog.create({ data: { userId: user.id, points: -reward.pointCost, reason: 'redemption', referenceId: rewardId } });

    const qrData = `AMANDEL-REDEEM-${Date.now()}-${user.id}-${rewardId}`;
    const qrCode = await QRCode.toDataURL(qrData);

    const redemption = await prisma.redemption.create({
      data: { userId: user.id, rewardId, qrCode },
      include: { reward: true },
    });

    res.status(201).json({ redemption });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/redemptions
router.get('/', authenticate, async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    const redemptions = await prisma.redemption.findMany({
      where,
      include: {
        reward: true,
        user: { select: { id: true, name: true, email: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ redemptions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/redemptions/:id/status
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['APPROVED', 'DELIVERED', 'REJECTED'].includes(status))
      return res.status(400).json({ error: 'Status tidak valid' });

    const redemption = await prisma.redemption.findUnique({
      where: { id: req.params.id },
      include: { reward: true, user: true },
    });
    if (!redemption) return res.status(404).json({ error: 'Redemption tidak ditemukan' });

    // Restore points if rejected
    if (status === 'REJECTED') {
      await prisma.user.update({
        where: { id: redemption.userId },
        data: { totalPoints: { increment: redemption.reward.pointCost } },
      });
      await prisma.reward.update({ where: { id: redemption.rewardId }, data: { stock: { increment: 1 } } });
      await prisma.pointLog.create({
        data: { userId: redemption.userId, points: redemption.reward.pointCost, reason: 'redemption_rejected', referenceId: redemption.id },
      });
    }

    const updated = await prisma.redemption.update({
      where: { id: req.params.id },
      data: { status, notes },
    });

    if (status === 'APPROVED') {
      sendMail(redemption.user.email, templates.rewardApproved(redemption.user, redemption.reward));
    }

    res.json({ redemption: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
