const router = require('express').Router();

const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { awardPoints, hasStreakBonus } = require('../services/points.service');

const prisma = require('../lib/prisma');

// GET /api/matches
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, mine, upcoming } = req.query;
    const where = {};
    if (status) where.status = status;
    if (upcoming === 'true') where.date = { gte: new Date() };
    if (mine === 'true') where.players = { some: { userId: req.user.id } };

    const matches = await prisma.match.findMany({
      where,
      include: {
        players: { include: { user: { select: { id: true, name: true, avatar: true, tier: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });
    res.json({ matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/matches
router.post('/', authenticate, async (req, res) => {
  try {
    const { eventId, eventName, court, format, date, timeStart, timeEnd, notes, players } = req.body;
    if (!eventName || !court || !format || !date || !timeStart)
      return res.status(400).json({ error: 'Field wajib tidak lengkap' });

    const match = await prisma.match.create({
      data: {
        eventId, eventName, court, format, date: new Date(date), timeStart, timeEnd, notes,
        createdById: req.user.id,
        players: {
          create: (players || []).map(p => ({ userId: p.userId, team: p.team })),
        },
      },
      include: { players: { include: { user: { select: { id: true, name: true } } } } },
    });

    // Notify players
    for (const p of match.players) {
      await prisma.notification.create({
        data: {
          userId: p.userId,
          title: 'Match Baru!',
          body: `Kamu dijadwalkan bermain di ${match.eventName} pada ${new Date(match.date).toLocaleDateString('id-ID')}`,
          type: 'match',
        },
      });
    }

    res.status(201).json({ match });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/matches/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: {
        players: { include: { user: { select: { id: true, name: true, avatar: true, tier: true, department: true } } } },
        createdBy: { select: { id: true, name: true } },
        event: true,
      },
    });
    if (!match) return res.status(404).json({ error: 'Match tidak ditemukan' });
    res.json({ match });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/matches/:id/result
router.put('/:id/result', authenticate, async (req, res) => {
  try {
    const { scores, mvpUserId } = req.body;

    await prisma.match.update({
      where: { id: req.params.id },
      data: { status: 'PENDING_VALIDATE' },
    });

    for (const s of scores) {
      await prisma.matchPlayer.updateMany({
        where: { matchId: req.params.id, userId: s.userId },
        data: { score: s.score, sets: s.sets, isMVP: s.userId === mvpUserId },
      });
    }

    res.json({ message: 'Hasil match dikirim, menunggu validasi admin' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/matches/:id/validate
router.put('/:id/validate', authenticate, requireAdmin, async (req, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: { players: true },
    });
    if (!match) return res.status(404).json({ error: 'Match tidak ditemukan' });

    // Determine winning team by highest total score
    const teamScores = {};
    for (const p of match.players) {
      teamScores[p.team] = (teamScores[p.team] || 0) + p.score;
    }
    const winTeam = Object.entries(teamScores).sort((a, b) => b[1] - a[1])[0]?.[0];

    for (const player of match.players) {
      const isWinner = String(player.team) === String(winTeam);
      let pts = 3; // participation
      const reason = isWinner ? 'match_win' : 'participation';
      if (isWinner) pts += 10;
      if (player.isMVP) pts += 5;

      await awardPoints(player.userId, pts, reason, match.id);

      const streak = await hasStreakBonus(player.userId);
      if (streak) await awardPoints(player.userId, 5, 'streak', match.id);

      await prisma.matchPlayer.updateMany({
        where: { matchId: match.id, userId: player.userId },
        data: { points: pts },
      });

      await prisma.notification.create({
        data: {
          userId: player.userId,
          title: 'Match Tervalidasi!',
          body: `Kamu mendapat ${pts} poin dari match ${match.eventName}`,
          type: 'match',
        },
      });
    }

    await prisma.match.update({ where: { id: req.params.id }, data: { status: 'VALIDATED' } });
    res.json({ message: 'Match divalidasi dan poin dikreditkan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/matches/:id/reject
router.put('/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.match.update({ where: { id: req.params.id }, data: { status: 'REJECTED' } });
    res.json({ message: 'Match ditolak' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
