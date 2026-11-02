function otpEmail({ otp, minutes, role }) {
  const portal = role === 'nurse' ? 'Nurse' : 'Family';
  const subject = `Your ElderCareGiver verification code: ${otp}`;

  const text =
    `Your ElderCareGiver ${portal} Portal verification code is ${otp}.\n` +
    `It expires in ${minutes} minutes. If you did not request this, ignore this email.`;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
    <h2 style="margin:0 0 8px">ElderCareGiver</h2>
    <p>Use this code to verify your email for the <b>${portal} Portal</b>:</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:16px 0">${otp}</p>
    <p>This code expires in <b>${minutes} minutes</b>.</p>
    <p style="color:#6b7280;font-size:13px">If you did not request this, you can safely ignore this email. Never share this code with anyone.</p>
  </div>`;

  return { subject, html, text };
}

module.exports = { otpEmail };

