const router = require('express').Router();

const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { sendMail, templates } = require('../services/email.service');
const crypto = require('crypto');

function genInviteLink() {
  return crypto.randomBytes(8).toString('hex');
}

const prisma = require('../lib/prisma');

// GET /api/events
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, mine } = req.query;
    const where = {};
    if (status) where.status = status;
    if (mine === 'true') where.createdById = req.user.id;
    const events = await prisma.event.findMany({
      where,
      include: { createdBy: { select: { id: true, name: true, avatar: true } }, _count: { select: { invitations: true } } },
      orderBy: { date: 'asc' },
    });
    res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/events
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, type, description, date, timeStart, timeEnd, court, maxPlayers, pointReward, inviteUserIds } = req.body;
    if (!title || !type || !date || !timeStart || !court)
      return res.status(400).json({ error: 'Field wajib tidak lengkap' });

    const inviteLink = genInviteLink();

    const event = await prisma.event.create({
      data: {
        title, type, description, date: new Date(date), timeStart, timeEnd, court,
        maxPlayers: maxPlayers || 8, pointReward: pointReward || 10,
        status: 'ACTIVE', inviteLink, createdById: req.user.id,
      },
    });

    if (inviteUserIds?.length) {
      for (const userId of inviteUserIds) {
        const inv = await prisma.invitation.create({ data: { eventId: event.id, userId, status: 'SENT' } });
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) sendMail(user.email, templates.invitation(event, inviteLink));
      }
    }

    res.status(201).json({ event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/events/join/:inviteLink  — must be before /:id
router.get('/join/:inviteLink', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { inviteLink: req.params.inviteLink },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    if (!event) return res.status(404).json({ error: 'Link undangan tidak valid' });
    res.json({ event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/events/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        invitations: { include: { user: { select: { id: true, name: true, avatar: true, department: true } } } },
        matches: true,
      },
    });
    if (!event) return res.status(404).json({ error: 'Event tidak ditemukan' });
    res.json({ event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/events/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, type, description, date, timeStart, timeEnd, court, maxPlayers, status } = req.body;
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { title, type, description, date: date ? new Date(date) : undefined, timeStart, timeEnd, court, maxPlayers, status },
    });
    res.json({ event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.event.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    res.json({ message: 'Event dibatalkan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/events/:id/invite
router.post('/:id/invite', authenticate, async (req, res) => {
  try {
    const { userIds } = req.body;
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: 'Event tidak ditemukan' });

    for (const userId of userIds) {
      await prisma.invitation.upsert({
        where: { eventId_userId: { eventId: event.id, userId } },
        update: { status: 'SENT' },
        create: { eventId: event.id, userId, status: 'SENT' },
      });
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) sendMail(user.email, templates.invitation(event, event.inviteLink));
    }
    res.json({ message: 'Undangan terkirim' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/events/:id/rsvp
router.post('/:id/rsvp', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACCEPTED', 'DECLINED'].includes(status))
      return res.status(400).json({ error: 'Status tidak valid' });

    const inv = await prisma.invitation.updateMany({
      where: { eventId: req.params.id, userId: req.user.id },
      data: { status },
    });
    res.json({ message: 'RSVP berhasil', updated: inv.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
