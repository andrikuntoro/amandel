
const prisma = require('../lib/prisma');

const TIER_THRESHOLDS = { BRONZE: 0, SILVER: 100, GOLD: 300, DIAMOND: 600 };

function getTier(points) {
  if (points >= 600) return 'DIAMOND';
  if (points >= 300) return 'GOLD';
  if (points >= 100) return 'SILVER';
  return 'BRONZE';
}

async function awardPoints(userId, points, reason, referenceId = null) {
  await prisma.pointLog.create({ data: { userId, points, reason, referenceId } });
  const user = await prisma.user.update({
    where: { id: userId },
    data: { totalPoints: { increment: points } },
  });
  const newTier = getTier(user.totalPoints);
  if (newTier !== user.tier) {
    await prisma.user.update({ where: { id: userId }, data: { tier: newTier } });
  }
}

async function hasStreakBonus(userId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const count = await prisma.pointLog.count({
    where: {
      userId,
      reason: { in: ['match_win', 'participation'] },
      createdAt: { gte: sevenDaysAgo },
    },
  });
  return count >= 3;
}

module.exports = { awardPoints, hasStreakBonus, getTier };
