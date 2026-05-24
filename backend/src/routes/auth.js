const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { closedLoop } = require('../middleware/closedloop.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { sendMail, templates } = require('../services/email.service');

const prisma = require('../lib/prisma');

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
router.post('/register', closedLoop, async (req, res) => {
  try {
    const { name, email, employeeId, password, department, phone, inviteCode } = req.body;
    if (!name || !email || !password || !department)
      return res.status(400).json({ error: 'Field wajib tidak lengkap' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email sudah terdaftar' });

    const hashed = await bcrypt.hash(password, 12);
    const joinedVia = inviteCode ? 'invite_code' : 'employee_verify';

    const user = await prisma.user.create({
      data: { name, email, employeeId, password: hashed, department, phone, inviteCode, joinedVia, status: 'ACTIVE' },
    });

    sendMail(email, templates.welcome(user));

    const token = signToken(user.id);
    const { password: _, ...safeUser } = user;
    res.status(201).json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email atau password salah' });
    if (user.status === 'BANNED') return res.status(403).json({ error: 'Akun kamu telah dibanned' });
    if (user.status === 'INACTIVE') return res.status(403).json({ error: 'Akun tidak aktif' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Email atau password salah' });

    const token = signToken(user.id);
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/verify-invite
router.post('/verify-invite', (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ error: 'Invite code wajib diisi' });
  const valid = inviteCode === process.env.COMMUNITY_INVITE_CODE;
  if (!valid) return res.status(400).json({ error: 'Invite code tidak valid' });
  res.json({ valid: true });
});

// POST /api/auth/verify-employee
router.post('/verify-employee', (req, res) => {
  const { email, employeeId } = req.body;
  const domain = process.env.AXA_EMAIL_DOMAIN;
  if (!email || !employeeId)
    return res.status(400).json({ error: 'Email dan Employee ID wajib diisi' });
  const valid = email.toLowerCase().endsWith(`@${domain}`) && employeeId.trim().length > 0;
  if (!valid) return res.status(400).json({ error: 'Email harus menggunakan domain AXA Mandiri' });
  res.json({ valid: true });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const { password: _, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out' });
});

module.exports = router;
