const closedLoop = (req, res, next) => {
  const { inviteCode, email, employeeId } = req.body;

  const communityCode = process.env.COMMUNITY_INVITE_CODE;
  const axaDomain = process.env.AXA_EMAIL_DOMAIN;

  const validInviteCode = inviteCode && inviteCode === communityCode;
  const validEmployee =
    email &&
    employeeId &&
    email.toLowerCase().endsWith(`@${axaDomain}`);

  if (!validInviteCode && !validEmployee) {
    return res.status(403).json({
      error: 'Akses ditolak. Kamu harus memiliki invite code atau email AXA Mandiri yang valid.',
    });
  }
  next();
};

module.exports = { closedLoop };
