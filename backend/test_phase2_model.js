/**
 * Phase 2 Test Suite: EmailOtp Database Model & Index Verification
 * As specified in EMAIL_IMPLEMENTATION_SPECS.md (Phase 2)
 */
const assert = require('assert');
const EmailOtp = require('./models/EmailOtp');

async function runPhase2Tests() {
  console.log('=============================================================');
  console.log('🧪 RUNNING PHASE 2: EMAIL OTP DATABASE MODEL & TTL TESTS');
  console.log('=============================================================');

  // 1. Verify model is loaded into Mongoose
  console.log('\n▶ [1/4] Checking EmailOtp Model compilation and schema paths...');
  assert.ok(EmailOtp, 'EmailOtp model must be exported');
  assert.strictEqual(EmailOtp.modelName, 'EmailOtp', 'Model name must be EmailOtp');

  const paths = EmailOtp.schema.paths;
  const expectedPaths = [
    'email',
    'role',
    'otpHash',
    'attempts',
    'verified',
    'verificationTokenHash',
    'sendCount',
    'lastSentAt',
    'windowStartedAt',
    'expiresAt',
  ];

  for (const path of expectedPaths) {
    assert.ok(paths[path], `Schema must contain path: ${path}`);
  }
  assert.deepStrictEqual(
    paths.role.enumValues,
    ['family', 'nurse'],
    'Role enum must be strictly ["family", "nurse"]'
  );
  console.log('  ✔ Model schema paths and enum constraints verified.');

  // 2. Check compound index and TTL index
  console.log('\n▶ [2/4] Verifying compound unique index and TTL index...');
  const indexes = EmailOtp.schema.indexes();
  
  const compoundUniqueIndex = indexes.find(
    ([fields, opts]) => fields.email === 1 && fields.role === 1 && opts && opts.unique === true
  );
  assert.ok(
    compoundUniqueIndex,
    'Compound unique index on { email: 1, role: 1 } must exist'
  );
  console.log('  ✔ Compound unique index { email: 1, role: 1 } verified.');

  const ttlIndex = indexes.find(
    ([fields, opts]) => fields.expiresAt === 1 && opts && opts.expireAfterSeconds === 0
  );
  assert.ok(
    ttlIndex,
    'TTL index on { expiresAt: 1 } with expireAfterSeconds: 0 must exist'
  );
  console.log('  ✔ MongoDB TTL index { expiresAt: 1, expireAfterSeconds: 0 } verified.');

  // 3. Test Create, Find, and Save lifecycle
  console.log('\n▶ [3/4] Testing record creation, lookup, and atomic state mutation...');
  const testEmail = 'test.phase2@example.com';
  const expiresAt = new Date(Date.now() + 10 * 60000);
  const otpHash = 'mock_bcrypt_hash_phase2';

  const created = await EmailOtp.create({
    email: testEmail,
    role: 'family',
    otpHash,
    expiresAt,
  });

  assert.ok(created._id, 'Created record must have an ID');
  assert.strictEqual(created.email, testEmail);
  assert.strictEqual(created.role, 'family');
  assert.strictEqual(created.attempts, 0);
  assert.strictEqual(created.verified, false);
  console.log('  ✔ EmailOtp document created successfully.');

  const found = await EmailOtp.findOne({ email: testEmail, role: 'family' });
  assert.ok(found, 'Created OTP record must be queryable by email + role');
  assert.strictEqual(found.otpHash, otpHash);

  // Update record state
  found.attempts += 1;
  found.verified = true;
  await found.save();

  const updated = await EmailOtp.findOne({ email: testEmail, role: 'family' });
  assert.strictEqual(updated.attempts, 1);
  assert.strictEqual(updated.verified, true);
  console.log('  ✔ OTP record state updated and saved.');

  // 4. Test Single-Use Consumption / Deletion
  console.log('\n▶ [4/4] Testing record deletion / token consumption...');
  await EmailOtp.deleteOne({ _id: found._id });
  const afterDelete = await EmailOtp.findOne({ email: testEmail, role: 'family' });
  assert.strictEqual(afterDelete, null, 'Record must be null after deletion');
  console.log('  ✔ Record deleted successfully.');

  console.log('\n=============================================================');
  console.log('🎉 ALL PHASE 2 DATABASE MODEL & TTL TESTS PASSED CLEANLY! 🎉');
  console.log('=============================================================');
}

runPhase2Tests().catch((err) => {
  console.error('❌ Phase 2 Test Failed:', err);
  process.exit(1);
});

