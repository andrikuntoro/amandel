const router = require('express').Router();

const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const prisma = require('../lib/prisma');

// GET /api/rewards
router.get('/', authenticate, async (req, res) => {
  try {
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { pointCost: 'asc' },
    });
    res.json({ rewards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/rewards
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, pointCost, stock, category, imageUrl } = req.body;
    if (!name || !description || !pointCost || !category)
      return res.status(400).json({ error: 'Field wajib tidak lengkap' });
    const reward = await prisma.reward.create({ data: { name, description, pointCost, stock: stock || 0, category, imageUrl } });
    res.status(201).json({ reward });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/rewards/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, pointCost, stock, category, imageUrl, isActive } = req.body;
    const reward = await prisma.reward.update({
      where: { id: req.params.id },
      data: { name, description, pointCost, stock, category, imageUrl, isActive },
    });
    res.json({ reward });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/rewards/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.reward.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Reward dinonaktifkan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
