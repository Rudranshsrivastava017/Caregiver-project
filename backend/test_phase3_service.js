/**
 * Phase 3 Test Suite: OTP Service & Email Templates
 * As specified in EMAIL_IMPLEMENTATION_SPECS.md (Phase 3)
 */
process.env.NODE_ENV = 'test';
require('dotenv').config();
const assert = require('assert');
const bcrypt = require('bcryptjs');
const { otpEmail } = require('./utils/emailTemplates');
const { sendOtp, verifyOtp, consumeVerification } = require('./services/otpService');
const EmailOtp = require('./models/EmailOtp');

async function runPhase3Tests() {
  console.log('=============================================================');
  console.log('🧪 RUNNING PHASE 3: OTP SERVICE & EMAIL TEMPLATES TEST SUITE');
  console.log('=============================================================');

  // 1. Test Email Template Generation
  console.log('\n▶ [1/6] Testing Email Template generation for Family and Nurse portals...');
  const familyTemplate = otpEmail({ otp: '482910', minutes: 10, role: 'family' });
  assert.ok(familyTemplate.subject.includes('482910'), 'Subject must contain the 6-digit OTP');
  assert.ok(familyTemplate.html.includes('Family Portal'), 'HTML must mention Family Portal');
  assert.ok(familyTemplate.text.includes('Family Portal'), 'Text must mention Family Portal');

  const nurseTemplate = otpEmail({ otp: '918273', minutes: 10, role: 'nurse' });
  assert.ok(nurseTemplate.subject.includes('918273'), 'Subject must contain the 6-digit OTP');
  assert.ok(nurseTemplate.html.includes('Nurse Portal'), 'HTML must mention Nurse Portal');
  assert.ok(nurseTemplate.text.includes('Nurse Portal'), 'Text must mention Nurse Portal');
  console.log('  ✔ Email templates accurately constructed for both roles.');

  // 2. Test sendOtp flow & Database persistence
  console.log('\n▶ [2/6] Testing sendOtp flow and hashed database persistence...');
  const testEmail = 'phase3.test@careelderly.org';
  await EmailOtp.deleteOne({ email: testEmail });

  await sendOtp(testEmail, 'family');
  const record = await EmailOtp.findOne({ email: testEmail, role: 'family' });
  assert.ok(record, 'EmailOtp document must be saved in database');
  assert.strictEqual(record.email, testEmail);
  assert.strictEqual(record.role, 'family');
  assert.strictEqual(record.attempts, 0);
  assert.strictEqual(record.verified, false);
  assert.ok(record.otpHash.startsWith('$2a$') || record.otpHash.startsWith('$2b$'), 'OTP must be stored as bcrypt hash');
  console.log('  ✔ OTP generated, hashed with bcrypt, and stored securely.');

  // 3. Test Resend Cooldown Protection (60s)
  console.log('\n▶ [3/6] Testing 60-second cooldown protection...');
  let cooldownCaught = false;
  try {
    await sendOtp(testEmail, 'family');
  } catch (err) {
    if (err.status === 429 && err.message.includes('Please wait')) {
      cooldownCaught = true;
    }
  }
  assert.ok(cooldownCaught, 'Immediate re-request must be rejected with 429 Cooldown error');
  console.log('  ✔ 60-second cooldown strictly enforced.');

  // 4. Test Incorrect OTP & Attempt Counter Increment
  console.log('\n▶ [4/6] Testing incorrect OTP validation and attempt threshold...');
  let wrongOtpCaught = false;
  try {
    await verifyOtp(testEmail, 'family', '000000');
  } catch (err) {
    if (err.status === 400 && err.message === 'Incorrect OTP.') {
      wrongOtpCaught = true;
    }
  }
  assert.ok(wrongOtpCaught, 'Wrong OTP must be rejected with 400 Incorrect OTP.');

  const afterWrong = await EmailOtp.findOne({ email: testEmail, role: 'family' });
  assert.strictEqual(afterWrong.attempts, 1, 'Failed attempt must increment attempts counter');

  // Trigger max attempt lockout (5 attempts)
  afterWrong.attempts = 5;
  await afterWrong.save();

  let maxAttemptsCaught = false;
  try {
    await verifyOtp(testEmail, 'family', '000000');
  } catch (err) {
    if (err.status === 429 && err.message.includes('Too many wrong attempts')) {
      maxAttemptsCaught = true;
    }
  }
  assert.ok(maxAttemptsCaught, 'Exceeding 5 attempts must block verification with 429.');
  console.log('  ✔ Attempt counter and 5-attempt brute-force lock verified.');

  // 5. Test Successful OTP Verification & Token Issuance
  console.log('\n▶ [5/6] Testing valid OTP verification and single-use token issuance...');
  const validOtp = '777888';
  const newHash = await bcrypt.hash(validOtp, 10);
  afterWrong.otpHash = newHash;
  afterWrong.attempts = 0;
  afterWrong.expiresAt = new Date(Date.now() + 10 * 60000);
  await afterWrong.save();

  const token = await verifyOtp(testEmail, 'family', validOtp);
  assert.ok(token, 'verifyOtp must return verification token');
  assert.strictEqual(token.length, 64, 'Token must be 32 bytes hex (64 chars)');

  const verifiedRecord = await EmailOtp.findOne({ email: testEmail, role: 'family' });
  assert.strictEqual(verifiedRecord.verified, true, 'Record must be marked verified: true');
  assert.ok(verifiedRecord.verificationTokenHash, 'Record must store verificationTokenHash');
  console.log('  ✔ Correct OTP successfully validated; single-use token generated.');

  // 6. Test consumeVerification & Role Binding
  console.log('\n▶ [6/6] Testing consumeVerification, role isolation, and single-use deletion...');
  
  // Wrong token test
  let invalidTokenCaught = false;
  try {
    await consumeVerification(testEmail, 'family', 'fake_token_123');
  } catch (err) {
    if (err.status === 403) invalidTokenCaught = true;
  }
  assert.ok(invalidTokenCaught, 'Invalid token must be rejected with 403 Forbidden.');

  // Role mismatch test (attempting to use family token on nurse route)
  let roleMismatchCaught = false;
  try {
    await consumeVerification(testEmail, 'nurse', token);
  } catch (err) {
    if (err.status === 403) roleMismatchCaught = true;
  }
  assert.ok(roleMismatchCaught, 'Using family token for nurse role must be rejected with 403.');

  // Valid consumption
  await consumeVerification(testEmail, 'family', token);
  const afterConsume = await EmailOtp.findOne({ email: testEmail, role: 'family' });
  assert.strictEqual(afterConsume, null, 'Record must be deleted immediately after consumption (single-use guarantee)');

  // Second consumption attempt must fail
  let replayCaught = false;
  try {
    await consumeVerification(testEmail, 'family', token);
  } catch (err) {
    if (err.status === 403) replayCaught = true;
  }
  assert.ok(replayCaught, 'Replaying an already consumed token must be rejected with 403.');
  console.log('  ✔ Token consumed, single-use enforced, and record purged.');

  console.log('\n=============================================================');
  console.log('🎉 ALL PHASE 3 OTP SERVICE & EMAIL TEMPLATES TESTS PASSED! 🎉');
  console.log('=============================================================');
}

runPhase3Tests().catch((err) => {
  console.error('❌ Phase 3 Test Failed:', err);
  process.exit(1);
});
