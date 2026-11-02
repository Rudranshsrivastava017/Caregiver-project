/**
 * Phase 4 Test Suite: Pre-Registration Email OTP API Endpoints
 * As specified in EMAIL_IMPLEMENTATION_SPECS.md (Phase 4)
 */
process.env.NODE_ENV = 'test';
require('dotenv').config();
const assert = require('assert');
const bcrypt = require('bcryptjs');
const { sendOtpHandler, verifyOtpHandler } = require('./routes/otpRoutes');
const { registerFamily, registerNurse, register } = require('./controllers/authController');
const EmailOtp = require('./models/EmailOtp');
const { UserModelAdapter } = require('./models/User');

// Mock response creator adhering to repo test standards
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

async function runPhase4Tests() {
  console.log('=============================================================');
  console.log('🧪 RUNNING PHASE 4: PRE-REGISTRATION OTP API ENDPOINTS');
  console.log('=============================================================');

  // 1. Test POST /api/auth/otp/send Validation & Already Registered
  console.log('\n▶ [1/6] Testing POST /api/auth/otp/send input validation and duplication check...');
  
  // Missing / invalid body
  const invalidReq = { body: { email: 'bad-email', role: 'invalid' } };
  const invalidRes = createMockRes();
  await sendOtpHandler(invalidReq, invalidRes);
  assert.strictEqual(invalidRes.statusCode, 400, 'Invalid email or role must return 400');

  // Pre-seed an existing user
  const existingEmail = `existing.${Date.now()}@careelderly.org`;
  await UserModelAdapter.createUser({
    userId: `USER-${Date.now().toString().slice(-6)}`,
    fullName: 'Existing User',
    email: existingEmail,
    passwordHash: 'pass123',
    role: 'user',
    isEmailVerified: true,
  });

  const dupReq = { body: { email: existingEmail, role: 'family' } };
  const dupRes = createMockRes();
  await sendOtpHandler(dupReq, dupRes);
  assert.strictEqual(dupRes.statusCode, 409, 'Existing email must return 409 Conflict');
  assert.ok(dupRes.responseData.message.includes('already registered'), 'Message must indicate already registered');
  console.log('  ✔ Input validation (400) and email duplication check (409) passed.');

  // 2. Test Successful OTP Dispatch
  console.log('\n▶ [2/6] Testing successful OTP dispatch for new registration...');
  const newFamilyEmail = `family.${Date.now()}@careelderly.org`;
  const sendReq = { body: { email: newFamilyEmail, role: 'family' } };
  const sendRes = createMockRes();
  await sendOtpHandler(sendReq, sendRes);
  assert.strictEqual(sendRes.statusCode, 200, 'Valid send must return 200 OK');
  assert.strictEqual(sendRes.responseData.message, 'OTP sent to your email.');

  const otpRecord = await EmailOtp.findOne({ email: newFamilyEmail, role: 'family' });
  assert.ok(otpRecord, 'EmailOtp document must be created');
  console.log('  ✔ OTP successfully generated and saved.');

  // 3. Test POST /api/auth/otp/verify with Wrong and Correct OTP
  console.log('\n▶ [3/6] Testing POST /api/auth/otp/verify...');
  const wrongReq = { body: { email: newFamilyEmail, role: 'family', otp: '000000' } };
  const wrongRes = createMockRes();
  await verifyOtpHandler(wrongReq, wrongRes);
  assert.strictEqual(wrongRes.statusCode, 400, 'Incorrect OTP must return 400');

  // Inject a known OTP for verification
  const validCode = '888999';
  otpRecord.otpHash = await bcrypt.hash(validCode, 10);
  otpRecord.attempts = 0;
  await otpRecord.save();

  const successReq = { body: { email: newFamilyEmail, role: 'family', otp: validCode } };
  const successRes = createMockRes();
  await verifyOtpHandler(successReq, successRes);
  assert.strictEqual(successRes.statusCode, 200, 'Correct OTP must return 200 OK');
  assert.ok(successRes.responseData.verificationToken, 'Response must include verificationToken');
  const familyToken = successRes.responseData.verificationToken;
  console.log('  ✔ OTP verification succeeded; verificationToken issued.');

  // 4. Test Protected Family Register Route
  console.log('\n▶ [4/6] Testing POST /api/auth/family/register protection...');
  
  // Attempt register WITHOUT token
  const noTokenReq = {
    body: {
      fullName: 'Family Tester',
      email: newFamilyEmail,
      password: 'password123',
    },
  };
  const noTokenRes = createMockRes();
  await registerFamily(noTokenReq, noTokenRes, (err) => { if (err) throw err; });
  assert.strictEqual(noTokenRes.statusCode, 403, 'Register without token must return 403 Forbidden');

  // Attempt register with INVALID token
  const badTokenReq = {
    body: {
      fullName: 'Family Tester',
      email: newFamilyEmail,
      password: 'password123',
      verificationToken: 'invalid_hex_token_123',
    },
  };
  const badTokenRes = createMockRes();
  await registerFamily(badTokenReq, badTokenRes, (err) => { if (err) throw err; });
  assert.strictEqual(badTokenRes.statusCode, 403, 'Register with invalid token must return 403');

  // Successful register with valid verificationToken
  const validRegReq = {
    body: {
      fullName: 'Family Member One',
      email: newFamilyEmail,
      password: 'password123',
      verificationToken: familyToken,
    },
  };
  const validRegRes = createMockRes();
  await registerFamily(validRegReq, validRegRes, (err) => { if (err) throw err; });
  assert.strictEqual(validRegRes.statusCode, 201, 'Valid register must return 201 Created');
  assert.strictEqual(validRegRes.responseData.user.isEmailVerified, true, 'Registered user must have isEmailVerified = true');
  console.log('  ✔ Family account created with isEmailVerified: true.');

  // 5. Test Token Single-Use (Replay Attack Prevention)
  console.log('\n▶ [5/6] Testing single-use token consumption...');
  const replayReq = {
    body: {
      fullName: 'Imposter Member',
      email: newFamilyEmail,
      password: 'password123',
      verificationToken: familyToken,
    },
  };
  const replayRes = createMockRes();
  await registerFamily(replayReq, replayRes, (err) => { if (err) throw err; });
  assert.strictEqual(replayRes.statusCode, 403, 'Replaying consumed token must return 403 Forbidden');
  console.log('  ✔ Replay blocked: Verification token consumed upon registration.');

  // 6. Test Nurse Registration & Role Binding Isolation
  console.log('\n▶ [6/6] Testing nurse OTP flow & role isolation...');
  const newNurseEmail = `nurse.${Date.now()}@careelderly.org`;
  const nurseSendReq = { body: { email: newNurseEmail, role: 'nurse' } };
  const nurseSendRes = createMockRes();
  await sendOtpHandler(nurseSendReq, nurseSendRes);
  
  const nurseOtpRecord = await EmailOtp.findOne({ email: newNurseEmail, role: 'nurse' });
  const nurseCode = '555666';
  nurseOtpRecord.otpHash = await bcrypt.hash(nurseCode, 10);
  nurseOtpRecord.attempts = 0;
  await nurseOtpRecord.save();

  const nurseVerifyReq = { body: { email: newNurseEmail, role: 'nurse', otp: nurseCode } };
  const nurseVerifyRes = createMockRes();
  await verifyOtpHandler(nurseVerifyReq, nurseVerifyRes);
  const nurseToken = nurseVerifyRes.responseData.verificationToken;

  // Attempt to use nurseToken on family route -> MUST FAIL with 403
  const mismatchReq = {
    body: {
      fullName: 'Sneaky Role Switch',
      email: newNurseEmail,
      password: 'password123',
      verificationToken: nurseToken,
    },
  };
  const mismatchRes = createMockRes();
  await registerFamily(mismatchReq, mismatchRes, (err) => { if (err) throw err; });
  assert.strictEqual(mismatchRes.statusCode, 403, 'Using nurse token on family register must return 403 Forbidden');

  // Register on correct nurse route -> MUST SUCCEED with 201
  const nurseRegReq = {
    body: {
      fullName: 'Nurse Preeti, RN',
      email: newNurseEmail,
      password: 'password123',
      qualification: 'B.Sc Nursing',
      yearsExperience: 4,
      legalIdNumber: 'NURSE-ID-9921',
      verificationToken: nurseToken,
    },
  };
  const nurseRegRes = createMockRes();
  await registerNurse(nurseRegReq, nurseRegRes, (err) => { if (err) throw err; });
  assert.strictEqual(nurseRegRes.statusCode, 201, 'Valid nurse register must return 201 Created');
  assert.strictEqual(nurseRegRes.responseData.user.role, 'caregiver', 'Nurse user must have caregiver role');
  assert.strictEqual(nurseRegRes.responseData.user.isEmailVerified, true, 'Nurse must have isEmailVerified = true');
  console.log('  ✔ Nurse registered with isEmailVerified: true & role isolation enforced.');

  console.log('\n=============================================================');
  console.log('🎉 ALL PHASE 4 PRE-REGISTRATION OTP API TESTS PASSED! 🎉');
  console.log('=============================================================');
}

runPhase4Tests().catch((err) => {
  console.error('❌ Phase 4 Test Failed:', err);
  process.exit(1);
});
