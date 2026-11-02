/**
 * Phase 7 Test Suite: Comprehensive Functional Verification Checklist
 * As specified in EMAIL_IMPLEMENTATION_SPECS.md (Section 7.1)
 */
process.env.NODE_ENV = 'test';
require('dotenv').config();
const assert = require('assert');
const bcrypt = require('bcryptjs');
const { sendOtpHandler, verifyOtpHandler } = require('./routes/otpRoutes');
const { registerFamily, registerNurse, login } = require('./controllers/authController');
const { sendOtp, verifyOtp, consumeVerification } = require('./services/otpService');
const { otpEmail } = require('./utils/emailTemplates');
const EmailOtp = require('./models/EmailOtp');
const { UserModelAdapter } = require('./models/User');

const createMockRes = () => {
  return {
    statusCode: 200,
    responseData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.responseData = data;
      return this;
    },
    send(data) {
      this.responseData = data;
      return this;
    },
    cookie() {},
    clearCookie() {},
  };
};

async function runPhase7Checklist() {
  console.log('=============================================================');
  console.log('📋 RUNNING PHASE 7: OFFICIAL 15-POINT FUNCTIONAL CHECKLIST');
  console.log('=============================================================');

  // Checklist Item 1: Send OTP for family email
  console.log('\n▶ [1/15] Send OTP for a new family email...');
  const famEmail = `checklist.family.${Date.now()}@careelderly.org`;
  const sendFamReq = { body: { email: famEmail, role: 'family' } };
  const sendFamRes = createMockRes();
  await sendOtpHandler(sendFamReq, sendFamRes);
  assert.strictEqual(sendFamRes.statusCode, 200);
  const famRecord = await EmailOtp.findOne({ email: famEmail, role: 'family' });
  assert.ok(famRecord, 'Family OTP record stored');
  console.log('  ✔ [PASSED] Family OTP dispatched and stored.');

  // Checklist Item 2: Send OTP for nurse email with Nurse Portal wording
  console.log('\n▶ [2/15] Send OTP for a new nurse email with Nurse Portal wording...');
  const nurseEmail = `checklist.nurse.${Date.now()}@careelderly.org`;
  const sendNurseReq = { body: { email: nurseEmail, role: 'nurse' } };
  const sendNurseRes = createMockRes();
  await sendOtpHandler(sendNurseReq, sendNurseRes);
  assert.strictEqual(sendNurseRes.statusCode, 200);
  const nurseTemplate = otpEmail({ otp: '123456', minutes: 10, role: 'nurse' });
  assert.ok(nurseTemplate.subject.includes('123456'));
  assert.ok(nurseTemplate.html.includes('Nurse Portal'));
  console.log('  ✔ [PASSED] Nurse OTP dispatched with Nurse Portal template.');

  // Checklist Item 3: Correct OTP returns verification token and enables Register
  console.log('\n▶ [3/15] Correct OTP returns verification token...');
  const testOtp = '112233';
  famRecord.otpHash = await bcrypt.hash(testOtp, 10);
  famRecord.attempts = 0;
  await famRecord.save();
  const verifyReq = { body: { email: famEmail, role: 'family', otp: testOtp } };
  const verifyRes = createMockRes();
  await verifyOtpHandler(verifyReq, verifyRes);
  assert.strictEqual(verifyRes.statusCode, 200);
  assert.ok(verifyRes.responseData.verificationToken);
  const validFamilyToken = verifyRes.responseData.verificationToken;
  console.log('  ✔ [PASSED] Valid OTP validated, verificationToken returned.');

  // Checklist Item 4: Wrong OTP shows error and increases attempt count
  console.log('\n▶ [4/15] Wrong OTP shows error and increases attempt count...');
  const tempEmail = `wrong.${Date.now()}@careelderly.org`;
  await sendOtp(tempEmail, 'family');
  const tempRecord = await EmailOtp.findOne({ email: tempEmail, role: 'family' });
  let wrongCaught = false;
  try {
    await verifyOtp(tempEmail, 'family', '999999');
  } catch (err) {
    if (err.status === 400 && err.message === 'Incorrect OTP.') wrongCaught = true;
  }
  assert.ok(wrongCaught);
  const afterWrong = await EmailOtp.findOne({ email: tempEmail, role: 'family' });
  assert.strictEqual(afterWrong.attempts, 1);
  console.log('  ✔ [PASSED] Wrong OTP rejected (400), attempt count incremented.');

  // Checklist Item 5: 5 wrong attempts blocks further tries until new OTP
  console.log('\n▶ [5/15] 5 wrong attempts blocks verification until new OTP is requested...');
  afterWrong.attempts = 5;
  await afterWrong.save();
  let lockedOut = false;
  try {
    await verifyOtp(tempEmail, 'family', '999999');
  } catch (err) {
    if (err.status === 429 && err.message.includes('Too many wrong attempts')) lockedOut = true;
  }
  assert.ok(lockedOut);
  console.log('  ✔ [PASSED] 5-attempt limit reached, verification blocked with 429.');

  // Checklist Item 6: OTP older than 10 minutes rejected as expired
  console.log('\n▶ [6/15] OTP older than 10 minutes rejected as expired...');
  const expiredEmail = `expired.${Date.now()}@careelderly.org`;
  await sendOtp(expiredEmail, 'family');
  const expRecord = await EmailOtp.findOne({ email: expiredEmail, role: 'family' });
  expRecord.expiresAt = new Date(Date.now() - 60000); // 1 minute in the past
  await expRecord.save();
  let expiredCaught = false;
  try {
    await verifyOtp(expiredEmail, 'family', '123456');
  } catch (err) {
    if (err.status === 400 && err.message.includes('expired')) expiredCaught = true;
  }
  assert.ok(expiredCaught);
  console.log('  ✔ [PASSED] Expired OTP rejected with 400.');

  // Checklist Item 7: Resend before 60 seconds rejected with wait message
  console.log('\n▶ [7/15] Resend before 60 seconds rejected with wait message...');
  const cooldownEmail = `cooldown.${Date.now()}@careelderly.org`;
  await sendOtp(cooldownEmail, 'family');
  let cooldownCaught = false;
  try {
    await sendOtp(cooldownEmail, 'family');
  } catch (err) {
    if (err.status === 429 && err.message.includes('Please wait')) cooldownCaught = true;
  }
  assert.ok(cooldownCaught);
  console.log('  ✔ [PASSED] 60-second cooldown enforced with 429.');

  // Checklist Item 8: 6th send within an hour rejected
  console.log('\n▶ [8/15] 6th send within an hour rejected...');
  const floodEmail = `flood.${Date.now()}@careelderly.org`;
  await sendOtp(floodEmail, 'family');
  const floodRecord = await EmailOtp.findOne({ email: floodEmail, role: 'family' });
  floodRecord.sendCount = 5;
  floodRecord.lastSentAt = new Date(Date.now() - 65000); // Past 60s cooldown, but within 1 hour
  floodRecord.windowStartedAt = new Date(Date.now() - 10 * 60000); // 10 minutes ago
  await floodRecord.save();
  let floodCaught = false;
  try {
    await sendOtp(floodEmail, 'family');
  } catch (err) {
    if (err.status === 429 && err.message.includes('Too many OTP requests')) floodCaught = true;
  }
  assert.ok(floodCaught);
  console.log('  ✔ [PASSED] Hourly sending limit enforced with 429.');

  // Checklist Item 9: Already registered email send is rejected (409)
  console.log('\n▶ [9/15] Already registered email send is rejected...');
  const preRegEmail = `registered.${Date.now()}@careelderly.org`;
  await UserModelAdapter.createUser({
    userId: `USER-${Date.now().toString().slice(-6)}`,
    fullName: 'Active User',
    email: preRegEmail,
    passwordHash: 'hashed123',
    role: 'user',
    isEmailVerified: true,
  });
  const dupSendReq = { body: { email: preRegEmail, role: 'family' } };
  const dupSendRes = createMockRes();
  await sendOtpHandler(dupSendReq, dupSendRes);
  assert.strictEqual(dupSendRes.statusCode, 409);
  console.log('  ✔ [PASSED] Duplicate registration rejected with 409.');

  // Checklist Item 10: Register without a token returns 403
  console.log('\n▶ [10/15] Register without a token returns 403 Forbidden...');
  const noTokenReq = { body: { fullName: 'No Token User', email: famEmail, password: 'password123' } };
  const noTokenRes = createMockRes();
  await registerFamily(noTokenReq, noTokenRes, (err) => { if (err) throw err; });
  assert.strictEqual(noTokenRes.statusCode, 403);
  console.log('  ✔ [PASSED] Unverified registration blocked with 403.');

  // Checklist Item 11: Register with token for a different email returns 403
  console.log('\n▶ [11/15] Register with a token for a different email returns 403...');
  const diffEmailReq = {
    body: {
      fullName: 'Spoofed Email User',
      email: 'imposter@different.com',
      password: 'password123',
      verificationToken: validFamilyToken,
    },
  };
  const diffEmailRes = createMockRes();
  await registerFamily(diffEmailReq, diffEmailRes, (err) => { if (err) throw err; });
  assert.strictEqual(diffEmailRes.statusCode, 403);
  console.log('  ✔ [PASSED] Token email mismatch blocked with 403.');

  // Checklist Item 12: Use a nurse token on family register route returns 403
  console.log('\n▶ [12/15] Use a nurse token on family register route returns 403...');
  const nurseRecord = await EmailOtp.findOne({ email: nurseEmail, role: 'nurse' });
  const nurseOtp = '777888';
  nurseRecord.otpHash = await bcrypt.hash(nurseOtp, 10);
  nurseRecord.attempts = 0;
  await nurseRecord.save();
  const validNurseToken = await verifyOtp(nurseEmail, 'nurse', nurseOtp);

  const nurseOnFamReq = {
    body: {
      fullName: 'Role Hijacker',
      email: nurseEmail,
      password: 'password123',
      verificationToken: validNurseToken,
    },
  };
  const nurseOnFamRes = createMockRes();
  await registerFamily(nurseOnFamReq, nurseOnFamRes, (err) => { if (err) throw err; });
  assert.strictEqual(nurseOnFamRes.statusCode, 403);
  console.log('  ✔ [PASSED] Cross-role token reuse blocked with 403.');

  // Checklist Item 13: Use the same token twice: second attempt returns 403
  console.log('\n▶ [13/15] Single-use token: second attempt returns 403...');
  const firstRegReq = {
    body: {
      fullName: 'Legitimate Member',
      email: famEmail,
      password: 'password123',
      verificationToken: validFamilyToken,
    },
  };
  const firstRegRes = createMockRes();
  await registerFamily(firstRegReq, firstRegRes, (err) => { if (err) throw err; });
  assert.strictEqual(firstRegRes.statusCode, 201);

  // Second attempt with same token
  const secondRegReq = { ...firstRegReq };
  const secondRegRes = createMockRes();
  await registerFamily(secondRegReq, secondRegRes, (err) => { if (err) throw err; });
  assert.strictEqual(secondRegRes.statusCode, 403);
  console.log('  ✔ [PASSED] Token consumed on first use; replay blocked with 403.');

  // Checklist Item 14: Successful register stores isEmailVerified: true
  console.log('\n▶ [14/15] Successful register stores isEmailVerified: true...');
  assert.strictEqual(firstRegRes.responseData.user.isEmailVerified, true);
  const createdUser = await UserModelAdapter.findById(firstRegRes.responseData.user.userId);
  assert.strictEqual(createdUser.isEmailVerified, true);
  console.log('  ✔ [PASSED] Created user account confirmed with isEmailVerified: true.');

  // Checklist Item 15: Existing users can still log in normally
  console.log('\n▶ [15/15] Existing users can still log in normally...');
  const seedEmail = 'vikram@careelderly.org';
  const existingVikram = await UserModelAdapter.findByEmail(seedEmail);
  if (!existingVikram) {
    await UserModelAdapter.createUser({
      userId: 'USER-001',
      fullName: 'Vikram Sharma',
      email: seedEmail,
      passwordHash: 'password123',
      role: 'user',
      isEmailVerified: true,
    });
  }
  const loginReq = { body: { email: seedEmail, password: 'password123' } };
  const loginRes = createMockRes();
  await login(loginReq, loginRes, (err) => { if (err) throw err; });
  assert.strictEqual(loginRes.statusCode, 200);
  assert.ok(loginRes.responseData.accessToken);
  assert.strictEqual(loginRes.responseData.user.email, seedEmail);
  console.log('  ✔ [PASSED] Existing users log in seamlessly with 200 OK & JWT.');

  console.log('\n=============================================================');
  console.log('🎉 15/15 FUNCTIONAL CHECKLIST ITEMS VERIFIED AND PASSED! 🎉');
  console.log('=============================================================');
}

runPhase7Checklist().catch((err) => {
  console.error('❌ Phase 7 Checklist Failed:', err);
  process.exit(1);
});

