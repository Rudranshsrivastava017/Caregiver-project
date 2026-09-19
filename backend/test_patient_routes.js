const { UserModelAdapter } = require('./models/User');
const { PatientModelAdapter } = require('./models/Patient');
const { generateAccessToken } = require('./utils/tokenUtils');
const patientController = require('./controllers/patientController');

// Mock request and response helpers
const createMockReq = (user, body = {}, params = {}, query = {}) => ({
  user,
  body,
  params,
  query,
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
};

async function runPatientTestSuite() {
  console.log('=== STARTING PHASE 2: PATIENT CRUD INTEGRATION TESTS ===\n');

  // 1. Setup User Vikram Sharma
  const user = await UserModelAdapter.createUser({
    userId: 'USER-TEST-VIKRAM',
    fullName: 'Vikram Test Sharma',
    email: 'vikram.test@careelderly.org',
    role: 'user',
  });
  console.log('✓ Test user initialized:', user.userId);

  // 2. Setup another user (imposter) to test ownership checks
  const imposterUser = await UserModelAdapter.createUser({
    userId: 'USER-TEST-IMPOSTER',
    fullName: 'Imposter User',
    email: 'imposter@careelderly.org',
    role: 'user',
  });
  console.log('✓ Imposter user initialized for ownership test:', imposterUser.userId);

  // 3. Test Create Patient (Valid)
  console.log('\n--- 1. Testing createPatient Controller ---');
  const createReq = createMockReq(user, {
    fullName: 'Savitri Devi',
    age: 79,
    gender: 'Female',
    mobilityStatus: 'assisted',
    medicalHistory: 'Severe arthritis in bilateral knees, hypertension.',
    emergencyContactName: 'Vikram Sharma',
    emergencyContactPhone: '+91 98765 43210',
    address: 'B-14 Hauz Khas, New Delhi',
  });
  const createRes = createMockRes();
  await patientController.createPatient(createReq, createRes, (err) => { throw err; });

  if (createRes.statusCode !== 201 || !createRes.data?.data?.patientId) {
    throw new Error(`Create patient failed: ${JSON.stringify(createRes.data)}`);
  }
  const createdPatient = createRes.data.data;
  console.log('✓ Patient created successfully with ID:', createdPatient.patientId, 'Name:', createdPatient.fullName);

  // 4. Test Create Patient Validation (Missing required fields)
  console.log('\n--- 2. Testing createPatient Validation Failure ---');
  const invalidReq = createMockReq(user, {
    fullName: 'Incomplete Patient',
    // Missing age, gender, emergency contact, address
  });
  const invalidRes = createMockRes();
  await patientController.createPatient(invalidReq, invalidRes, () => {});
  if (invalidRes.statusCode !== 400) {
    throw new Error(`Expected 400 validation error, got: ${invalidRes.statusCode}`);
  }
  console.log('✓ Validation blocked incomplete patient submission with 400:', invalidRes.data.message);

  // 5. Test Get Patients List for User
  console.log('\n--- 3. Testing getPatients Controller ---');
  const listReq = createMockReq(user);
  const listRes = createMockRes();
  await patientController.getPatients(listReq, listRes, (err) => { throw err; });
  if (listRes.statusCode !== 200 || !Array.isArray(listRes.data?.data)) {
    throw new Error(`getPatients failed: ${JSON.stringify(listRes.data)}`);
  }
  console.log(`✓ Retrieved ${listRes.data.count} patient(s) linked to ${user.userId}`);

  // 6. Test Get Single Patient by ID
  console.log('\n--- 4. Testing getPatientById Controller ---');
  const getByIdReq = createMockReq(user, {}, { id: createdPatient.patientId });
  const getByIdRes = createMockRes();
  await patientController.getPatientById(getByIdReq, getByIdRes, (err) => { throw err; });
  if (getByIdRes.statusCode !== 200 || getByIdRes.data.data.fullName !== 'Savitri Devi') {
    throw new Error(`getPatientById failed: ${JSON.stringify(getByIdRes.data)}`);
  }
  console.log('✓ getPatientById retrieved matching profile:', getByIdRes.data.data.fullName);

  // 7. Test Ownership Guard (Imposter cannot view or modify Vikram\'s patient)
  console.log('\n--- 5. Testing Ownership Security Guard ---');
  const imposterReq = createMockReq(imposterUser, {}, { id: createdPatient.patientId });
  const imposterRes = createMockRes();
  await patientController.getPatientById(imposterReq, imposterRes, () => {});
  if (imposterRes.statusCode !== 403) {
    throw new Error(`Expected 403 Forbidden for imposter user, got: ${imposterRes.statusCode}`);
  }
  console.log('✓ Security guard correctly denied unauthorized access with 403 Forbidden');

  // 8. Test Update Patient
  console.log('\n--- 6. Testing updatePatient Controller ---');
  const updateReq = createMockReq(
    user,
    {
      mobilityStatus: 'bedridden',
      medicalHistory: 'Updated: Post-fall recovery, temporarily bedridden.',
    },
    { id: createdPatient.patientId }
  );
  const updateRes = createMockRes();
  await patientController.updatePatient(updateReq, updateRes, (err) => { throw err; });
  if (updateRes.statusCode !== 200 || updateRes.data.data.mobilityStatus !== 'bedridden') {
    throw new Error(`updatePatient failed: ${JSON.stringify(updateRes.data)}`);
  }
  console.log('✓ Patient mobility updated to:', updateRes.data.data.mobilityStatus);

  // 9. Test Delete Patient
  console.log('\n--- 7. Testing deletePatient Controller ---');
  const deleteReq = createMockReq(user, {}, { id: createdPatient.patientId });
  const deleteRes = createMockRes();
  await patientController.deletePatient(deleteReq, deleteRes, (err) => { throw err; });
  if (deleteRes.statusCode !== 200) {
    throw new Error(`deletePatient failed: ${JSON.stringify(deleteRes.data)}`);
  }
  console.log('✓ Patient deleted successfully with 200 response');

  // 10. Verify Deletion
  const verifyDeleteReq = createMockReq(user, {}, { id: createdPatient.patientId });
  const verifyDeleteRes = createMockRes();
  await patientController.getPatientById(verifyDeleteReq, verifyDeleteRes, () => {});
  if (verifyDeleteRes.statusCode !== 404) {
    throw new Error(`Expected 404 after deletion, got: ${verifyDeleteRes.statusCode}`);
  }
  console.log('✓ Verified patient profile is no longer accessible (404 Not Found)');

  console.log('\n🎉 ALL PHASE 2 PATIENT TESTS PASSED CLEANLY & SUCCESSFULLY! 🎉\n');
}

runPatientTestSuite().catch((err) => {
  console.error('❌ Test Suite Failed:', err);
  process.exit(1);
});
