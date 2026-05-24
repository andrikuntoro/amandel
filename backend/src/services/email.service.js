const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const templates = {
  invitation: (event, inviteLink) => ({
    subject: `🎾 Kamu diundang ke ${event.title} – Amandel`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#080814;color:#fff;padding:24px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px;">
          <h1 style="color:#00008F;letter-spacing:0.2em;font-size:24px;">AMANDEL</h1>
          <p style="color:#FF1721;font-size:11px;margin:0;">AXA MANDIRI PADEL CLUB</p>
        </div>
        <h2 style="color:#FFB800;">🎾 Undangan Event</h2>
        <h3 style="color:#fff;">${event.title}</h3>
        <p style="color:#888;">📅 ${new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="color:#888;">🕐 ${event.timeStart} WIB</p>
        <p style="color:#888;">📍 ${event.court}</p>
        <a href="${process.env.FRONTEND_URL}/events/join/${inviteLink}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#FF1721;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
          KONFIRMASI KEHADIRAN
        </a>
        <p style="color:#444;font-size:11px;margin-top:20px;">Link hanya berlaku untuk kamu. Jangan dibagikan.</p>
      </div>
    `,
  }),
  welcome: (user) => ({
    subject: `🎾 Selamat bergabung di Amandel, ${user.name}!`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
        <h1 style="color:#00008F;">Selamat datang, ${user.name}!</h1>
        <p>Akun Amandel kamu sudah aktif. Mulai kumpulkan poin dan naik ke tier Diamond!</p>
        <a href="${process.env.FRONTEND_URL}/login" style="padding:12px 24px;background:#00008F;color:#fff;border-radius:8px;text-decoration:none;">LOGIN SEKARANG</a>
      </div>
    `,
  }),
  rewardApproved: (user, reward) => ({
    subject: `✅ Reward "${reward.name}" diapprove!`,
    html: `<p>Hi ${user.name}, reward <strong>${reward.name}</strong> kamu sudah diapprove dan akan segera dikirimkan.</p>`,
  }),
};

const sendMail = async (to, template) => {
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, ...template });
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
  }
};

module.exports = { sendMail, templates };
