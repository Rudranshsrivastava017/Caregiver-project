const assert = require('assert');
const careNoteController = require('./controllers/careNoteController');
const { CareNoteModelAdapter } = require('./models/CareNote');
const { BookingModelAdapter } = require('./models/Booking');
const { CaregiverModelAdapter } = require('./models/Caregiver');
const { PatientModelAdapter } = require('./models/Patient');
const { UserModelAdapter } = require('./models/User');
const { emitBookingStatusUpdate, emitNewCaregiverRequest, emitCareNoteAdded } = require('./sockets/index');

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

async function runPhase5TestSuite() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING PHASE 5: CARE NOTES & REAL-TIME SOCKET TEST SUITE');
  console.log('=============================================================\n');

  try {
    // 1. Setup Test Users & Caregiver Profile
    console.log('▶ [1/6] Setting up test data for Caregiver, Patient, and Booking...');
    const familyUser = await UserModelAdapter.createUser({
      userId: 'USER-P5-FAMILY',
      fullName: 'Vikram Family Test',
      email: 'vikram.p5@careelderly.org',
      role: 'user',
    });

    const cgUser = await UserModelAdapter.createUser({
      userId: 'USER-P5-CG',
      fullName: 'Nurse Anita Test',
      email: 'anita.p5@careelderly.org',
      role: 'caregiver',
    });

    const caregiver = await CaregiverModelAdapter.createCaregiver({
      caregiverId: 'CG-P5-TEST',
      linkedUserId: cgUser.userId,
      fullName: 'Nurse Anita Test',
      specialization: 'nurse',
      qualification: 'B.Sc Nursing',
      verified: true,
    });

    const patient = await PatientModelAdapter.createPatient({
      patientId: 'PAT-P5-TEST',
      linkedUserId: familyUser.userId,
      fullName: 'Ramesh Senior Test',
      age: 78,
      gender: 'Male',
      mobilityStatus: 'assisted',
    });

    const booking = await BookingModelAdapter.createBooking({
      bookingId: 'BK-P5-TEST',
      userId: familyUser.userId,
      patientId: patient.patientId,
      caregiverId: caregiver.caregiverId,
      serviceId: 'SVC001',
      scheduledDate: '2026-09-25',
      scheduledTime: 'Morning (08:00 AM - 12:00 PM)',
      duration: '4 Hours',
      status: 'in_progress',
      totalPrice: 800,
    });

    console.log('  ✔ Test entities created: User, Caregiver, Patient, Booking.');

    // 2. Assigned Caregiver logs a Care Note with Vitals
    console.log('\n▶ [2/6] Caregiver logs Care Note with vitals for active shift...');
    const cgReqUser = { userId: cgUser.userId, role: 'caregiver' };
    const createReq = createMockReq(cgReqUser, {
      bookingId: booking.bookingId,
      vitals: {
        bp: '122/80 mmHg',
        pulse: '74 bpm',
        temperature: '98.6 °F',
        sugarLevel: '105 mg/dL',
        oxygenLevel: '99%',
      },
      tasksPerformed: [
        'Checked morning blood pressure and SpO2',
        'Assisted with mobility and light morning walk',
        'Administered prescribed post-breakfast medication',
      ],
      observations: 'Patient was responsive, alert, and reported no joint pain today.',
    });
    const createRes = createMockRes();
    await careNoteController.createCareNote(createReq, createRes, (err) => { throw err; });

    assert.strictEqual(createRes.statusCode, 201, 'Care note should be created with 201');
    assert.strictEqual(createRes.data.status, 'success');
    assert.ok(createRes.data.data.noteId, 'Generated noteId required');
    assert.strictEqual(createRes.data.data.vitals.bp, '122/80 mmHg');
    console.log('  ✔ Care note created successfully with ID:', createRes.data.data.noteId);
    console.log('  ✔ Vitals recorded: BP 122/80, Pulse 74, SpO2 99%');

    // 3. Unauthorized family user attempting to log care note should be blocked (403)
    console.log('\n▶ [3/6] Testing RBAC: Family user cannot log clinical care notes...');
    const userReqUser = { userId: familyUser.userId, role: 'user' };
    const invalidCreateReq = createMockReq(userReqUser, {
      bookingId: booking.bookingId,
      observations: 'Attempting to submit notes as user',
    });
    const invalidCreateRes = createMockRes();
    await careNoteController.createCareNote(invalidCreateReq, invalidCreateRes, (err) => { throw err; });

    assert.strictEqual(invalidCreateRes.statusCode, 403, 'Should return 403 Forbidden for non-caregiver');
    console.log('  ✔ RBAC properly enforced (403 Forbidden for non-caregiver).');

    // 4. Family user retrieves care notes timeline for booking
    console.log('\n▶ [4/6] Family user retrieves Care Notes Timeline for their booking...');
    const getBookingNotesReq = createMockReq(userReqUser, {}, { bookingId: booking.bookingId });
    const getBookingNotesRes = createMockRes();
    await careNoteController.getCareNotesByBooking(getBookingNotesReq, getBookingNotesRes, (err) => { throw err; });

    assert.strictEqual(getBookingNotesRes.statusCode, 200, 'Should return 200 OK');
    assert.strictEqual(getBookingNotesRes.data.status, 'success');
    assert.ok(getBookingNotesRes.data.data.length >= 1, 'Should return at least 1 note');
    console.log(`  ✔ Retrieved ${getBookingNotesRes.data.data.length} note(s) for booking BK-P5-TEST.`);
    console.log('  ✔ Timeline observation:', getBookingNotesRes.data.data[0].observations);

    // 5. Family user retrieves historical notes by patient ID
    console.log('\n▶ [5/6] Family user retrieves clinical history for elderly patient...');
    const getPatientNotesReq = createMockReq(userReqUser, {}, { patientId: patient.patientId });
    const getPatientNotesRes = createMockRes();
    await careNoteController.getCareNotesByPatient(getPatientNotesReq, getPatientNotesRes, (err) => { throw err; });

    assert.strictEqual(getPatientNotesRes.statusCode, 200, 'Should return 200 OK');
    assert.ok(getPatientNotesRes.data.data.length >= 1, 'Should return patient notes');
    console.log(`  ✔ Retrieved ${getPatientNotesRes.data.data.length} note(s) for patient ${patient.fullName}.`);

    // 6. Test Socket Emitters without error
    console.log('\n▶ [6/6] Verifying Socket helper event emitters...');
    assert.doesNotThrow(() => {
      emitBookingStatusUpdate(familyUser.userId, booking.bookingId, 'confirmed');
      emitNewCaregiverRequest(cgUser.userId, booking.bookingId, { summary: 'New shift' });
      emitCareNoteAdded(familyUser.userId, booking.bookingId, createRes.data.data.noteId);
    }, 'Socket emitters should handle offline/null io gracefully without crashing');
    console.log('  ✔ Socket emitters executed safely with robust graceful fallbacks.');

    console.log('\n=============================================================');
    console.log('🎉 ALL 6 PHASE 5 CARE NOTES & SOCKET TESTS PASSED CLEANLY!');
    console.log('=============================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Phase 5 Test Failed:', error);
    process.exit(1);
  }
}

runPhase5TestSuite();
