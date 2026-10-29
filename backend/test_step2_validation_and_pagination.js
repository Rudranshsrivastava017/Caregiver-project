/**
 * Test Suite: Step 2 Input Validation Guards & Query Pagination Defaults
 * Tests:
 * 1. Clinical vitals validation in createCareNote (valid vitals)
 * 2. Invalid Blood Pressure format rejection (HTTP 400, INVALID_INPUT)
 * 3. Out-of-range pulse rejection (HTTP 400, INVALID_INPUT)
 * 4. Out-of-range SpO2 rejection (HTTP 400, INVALID_INPUT)
 * 5. Out-of-range temperature rejection (HTTP 400, INVALID_INPUT)
 * 6. Booking scheduledDate format validation (HTTP 400, INVALID_INPUT)
 * 7. Patient query pagination (page=1&limit=1 vs full list)
 * 8. Caregiver query pagination (page=1&limit=2 vs full list)
 * 9. Booking query pagination (page=1&limit=1 vs full list)
 */

const assert = require('assert');
const { UserModelAdapter } = require('./models/User');
const { PatientModelAdapter } = require('./models/Patient');
const { CaregiverModelAdapter } = require('./models/Caregiver');
const { BookingModelAdapter } = require('./models/Booking');
const { ServiceModelAdapter } = require('./models/Service');
const { createCareNote } = require('./controllers/careNoteController');
const { getPatients } = require('./controllers/patientController');
const { getCaregivers } = require('./controllers/caregiverController');
const { createBooking, getBookings } = require('./controllers/bookingController');

// Mock helpers
const createMockRes = () => {
  return {
    statusCode: null,
    responseData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.responseData = data;
      return this;
    },
  };
};

async function runStep2Tests() {
  console.log('=============================================================');
  console.log('🧪 RUNNING STEP 2: INPUT VALIDATION GUARDS & PAGINATION TESTS');
  console.log('=============================================================');

  // --- Fixtures Setup ---
  const familyUser = await UserModelAdapter.createUser({
    userId: 'USER-P12-FAM',
    fullName: 'Family Tester',
    email: 'tester.fam@careelderly.org',
    role: 'user',
  });

  const cgUser = await UserModelAdapter.createUser({
    userId: 'USER-P12-CG',
    fullName: 'Nurse Radha',
    email: 'radha.nurse@careelderly.org',
    role: 'caregiver',
  });

  const caregiver = await CaregiverModelAdapter.createCaregiver({
    caregiverId: 'CG-P12-TEST',
    linkedUserId: cgUser.userId,
    fullName: 'Nurse Radha',
    specialization: 'nurse',
    qualification: 'B.Sc Nursing',
    verified: true,
  });

  const patient = await PatientModelAdapter.createPatient({
    patientId: 'PAT-P12-TEST',
    linkedUserId: familyUser.userId,
    fullName: 'Devi Elder',
    age: 82,
    gender: 'Female',
    mobilityStatus: 'assisted',
  });

  const service = await ServiceModelAdapter.createService({
    serviceId: 'SVC-P12-TEST',
    serviceName: 'Elderly Nursing Care',
    category: 'medical',
    price: 800,
  });

  const booking = await BookingModelAdapter.createBooking({
    bookingId: 'BK-P12-TEST',
    userId: familyUser.userId,
    patientId: patient.patientId,
    caregiverId: caregiver.caregiverId,
    serviceId: service.serviceId,
    scheduledDate: '2026-10-15',
    scheduledTime: 'Morning (08:00 AM - 12:00 PM)',
    duration: '4 Hours',
    status: 'in_progress',
    totalPrice: 800,
  });

  const cgCaller = { user: { userId: cgUser.userId, role: 'caregiver' } };

  // 1. Valid Clinical Vitals Acceptance
  console.log('\n▶ [1/9] Testing Valid Clinical Vitals Acceptance...');
  const validVitalsReq = {
    ...cgCaller,
    body: {
      bookingId: booking.bookingId,
      vitals: {
        bp: '120/80 mmHg',
        pulse: '72 bpm',
        temperature: '98.6 °F',
        sugarLevel: '110 mg/dL',
        oxygenLevel: '98%',
      },
      tasksPerformed: ['Vitals recorded', 'Assisted walking'],
      observations: 'Stable and comfortable',
    },
  };
  const validRes = createMockRes();
  await createCareNote(validVitalsReq, validRes, (err) => { if (err) throw err; });

  assert.strictEqual(validRes.statusCode, 201, 'Valid vitals should return 201 Created');
  assert.strictEqual(validRes.responseData.status, 'success');
  console.log('  ✔ Valid vitals accepted and recorded successfully.');

  // 2. Invalid Blood Pressure Format Rejection
  console.log('\n▶ [2/9] Testing Invalid Blood Pressure Format Rejection...');
  const invalidBpReq = {
    ...cgCaller,
    body: {
      bookingId: booking.bookingId,
      vitals: { bp: 'invalid-bp-format' },
    },
  };
  const invalidBpRes = createMockRes();
  await createCareNote(invalidBpReq, invalidBpRes, (err) => { if (err) throw err; });

  assert.strictEqual(invalidBpRes.statusCode, 400, 'Invalid BP should return 400 Bad Request');
  assert.strictEqual(invalidBpRes.responseData.error.code, 'INVALID_INPUT');
  assert.ok(invalidBpRes.responseData.message.includes('Blood pressure must be in valid format'));
  console.log('  ✔ Invalid BP format rejected with HTTP 400 INVALID_INPUT.');

  // 3. Out-of-Range Pulse Rejection
  console.log('\n▶ [3/9] Testing Out-of-Range Pulse Rejection...');
  const invalidPulseReq = {
    ...cgCaller,
    body: {
      bookingId: booking.bookingId,
      vitals: { pulse: '999 bpm' }, // physiologically impossible pulse
    },
  };
  const invalidPulseRes = createMockRes();
  await createCareNote(invalidPulseReq, invalidPulseRes, (err) => { if (err) throw err; });

  assert.strictEqual(invalidPulseRes.statusCode, 400, 'Out-of-range pulse should return 400');
  assert.strictEqual(invalidPulseRes.responseData.error.code, 'INVALID_INPUT');
  assert.ok(invalidPulseRes.responseData.message.includes('Pulse must be a valid number between 30 and 240'));
  console.log('  ✔ Out-of-range pulse rejected with HTTP 400 INVALID_INPUT.');

  // 4. Out-of-Range SpO2 (Oxygen Level) Rejection
  console.log('\n▶ [4/9] Testing Out-of-Range SpO2 Rejection...');
  const invalidOxyReq = {
    ...cgCaller,
    body: {
      bookingId: booking.bookingId,
      vitals: { oxygenLevel: '145%' }, // saturation cannot exceed 100%
    },
  };
  const invalidOxyRes = createMockRes();
  await createCareNote(invalidOxyReq, invalidOxyRes, (err) => { if (err) throw err; });

  assert.strictEqual(invalidOxyRes.statusCode, 400, 'Out-of-range SpO2 should return 400');
  assert.strictEqual(invalidOxyRes.responseData.error.code, 'INVALID_INPUT');
  assert.ok(invalidOxyRes.responseData.message.includes('Oxygen saturation (SpO2) must be between 50% and 100%'));
  console.log('  ✔ Out-of-range oxygenLevel rejected with HTTP 400 INVALID_INPUT.');

  // 5. Out-of-Range Body Temperature Rejection
  console.log('\n▶ [5/9] Testing Out-of-Range Body Temperature Rejection...');
  const invalidTempReq = {
    ...cgCaller,
    body: {
      bookingId: booking.bookingId,
      vitals: { temperature: '150 °F' },
    },
  };
  const invalidTempRes = createMockRes();
  await createCareNote(invalidTempReq, invalidTempRes, (err) => { if (err) throw err; });

  assert.strictEqual(invalidTempRes.statusCode, 400, 'Out-of-range temp should return 400');
  assert.strictEqual(invalidTempRes.responseData.error.code, 'INVALID_INPUT');
  assert.ok(invalidTempRes.responseData.message.includes('Body temperature must be between 90.0°F and 108.0°F'));
  console.log('  ✔ Out-of-range temperature rejected with HTTP 400 INVALID_INPUT.');

  // 6. Booking Scheduled Date Format Validation
  console.log('\n▶ [6/9] Testing Booking scheduledDate Format Validation...');
  const invalidDateReq = {
    user: { userId: familyUser.userId, role: 'user' },
    body: {
      patientId: patient.patientId,
      caregiverId: caregiver.caregiverId,
      serviceId: service.serviceId,
      scheduledDate: '2026/10/15', // invalid delimiter (requires YYYY-MM-DD)
      scheduledTime: 'Morning (08:00 AM - 12:00 PM)',
    },
  };
  const invalidDateRes = createMockRes();
  await createBooking(invalidDateReq, invalidDateRes, (err) => { if (err) throw err; });

  assert.strictEqual(invalidDateRes.statusCode, 400, 'Invalid date format should return 400');
  assert.strictEqual(invalidDateRes.responseData.error.code, 'INVALID_INPUT');
  assert.ok(invalidDateRes.responseData.message.includes('YYYY-MM-DD format'));
  console.log('  ✔ Malformed scheduledDate rejected with HTTP 400 INVALID_INPUT.');

  // 7. Patient Query Pagination
  console.log('\n▶ [7/9] Testing Patient Query Pagination...');
  // Create additional patient for pagination test
  await PatientModelAdapter.createPatient({
    patientId: 'PAT-P12-PAG-2',
    linkedUserId: familyUser.userId,
    fullName: 'Second Elder Test',
    age: 79,
    gender: 'Male',
    mobilityStatus: 'independent',
  });

  const fullPatientsReq = { user: { userId: familyUser.userId, role: 'user' }, query: {} };
  const fullPatientsRes = createMockRes();
  await getPatients(fullPatientsReq, fullPatientsRes, (err) => { if (err) throw err; });
  assert.strictEqual(fullPatientsRes.statusCode, 200);
  assert.ok(fullPatientsRes.responseData.data.length >= 2, 'Unpaginated query returns all records');

  const paginatedPatientsReq = { user: { userId: familyUser.userId, role: 'user' }, query: { page: '1', limit: '1' } };
  const paginatedPatientsRes = createMockRes();
  await getPatients(paginatedPatientsReq, paginatedPatientsRes, (err) => { if (err) throw err; });
  assert.strictEqual(paginatedPatientsRes.statusCode, 200);
  assert.strictEqual(paginatedPatientsRes.responseData.count, 1, 'Limit 1 should return count = 1');
  assert.strictEqual(paginatedPatientsRes.responseData.page, 1);
  assert.ok(paginatedPatientsRes.responseData.total >= 2);
  assert.ok(paginatedPatientsRes.responseData.totalPages >= 2);
  console.log('  ✔ Patient pagination correctly splits results and provides metadata.');

  // 8. Caregiver Query Pagination
  console.log('\n▶ [8/9] Testing Caregiver Query Pagination...');
  const paginatedCgReq = { query: { page: '1', limit: '1' } };
  const paginatedCgRes = createMockRes();
  await getCaregivers(paginatedCgReq, paginatedCgRes, (err) => { if (err) throw err; });
  assert.strictEqual(paginatedCgRes.statusCode, 200);
  assert.strictEqual(paginatedCgRes.responseData.count, 1, 'Limit 1 should return count = 1');
  assert.ok(paginatedCgRes.responseData.total >= 1);
  assert.strictEqual(paginatedCgRes.responseData.page, 1);
  console.log('  ✔ Caregiver directory pagination correctly returns limit slice and total count.');

  // 9. Booking Query Pagination
  console.log('\n▶ [9/9] Testing Booking Query Pagination...');
  const paginatedBkReq = { user: { userId: familyUser.userId, role: 'user' }, query: { page: '1', limit: '1' } };
  const paginatedBkRes = createMockRes();
  await getBookings(paginatedBkReq, paginatedBkRes, (err) => { if (err) throw err; });
  assert.strictEqual(paginatedBkRes.statusCode, 200);
  assert.strictEqual(paginatedBkRes.responseData.count, 1);
  assert.strictEqual(paginatedBkRes.responseData.page, 1);
  assert.ok(paginatedBkRes.responseData.total >= 1);
  console.log('  ✔ Booking list pagination accurately slices items with page metadata.');

  console.log('\n=============================================================');
  console.log('🎉 ALL 9 STEP 2 VALIDATION & PAGINATION TESTS PASSED 100%! 🎉');
  console.log('=============================================================\n');
}

runStep2Tests().catch((err) => {
  console.error('❌ Step 2 Test failed:', err);
  process.exit(1);
});
