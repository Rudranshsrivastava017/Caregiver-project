const bookingController = require('./controllers/bookingController');
const { UserModelAdapter } = require('./models/User');
const { PatientModelAdapter } = require('./models/Patient');
const { CaregiverModelAdapter } = require('./models/Caregiver');
const { ServiceModelAdapter } = require('./models/Service');
const { BookingModelAdapter } = require('./models/Booking');

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

async function runBookingTestSuite() {
  console.log('=== STARTING PHASE 4: BOOKING FLOW & CONFLICT PREVENTION TESTS ===\n');

  // 1. Setup Test Users
  const user1 = await UserModelAdapter.createUser({
    userId: 'USER-BK-1',
    fullName: 'Rohan Verma',
    email: 'rohan.verma@careelderly.org',
    role: 'user',
  });

  const user2 = await UserModelAdapter.createUser({
    userId: 'USER-BK-2',
    fullName: 'Ananya Gupta',
    email: 'ananya.gupta@careelderly.org',
    role: 'user',
  });

  // Setup Caregiver User & Profile
  const cgUser = await UserModelAdapter.createUser({
    userId: 'USER-CG-TEST',
    fullName: 'Nurse Sunita Test',
    email: 'sunita.nurse@careelderly.org',
    role: 'caregiver',
  });

  const caregiver = await CaregiverModelAdapter.createCaregiver({
    caregiverId: 'CG-BK-TEST',
    linkedUserId: cgUser.userId,
    fullName: 'Nurse Sunita Test',
    specialization: 'nurse',
    qualification: 'B.Sc Nursing',
    yearsExperience: 7,
    rating: 4.9,
    reviewsCount: 15,
    serviceAreas: ['South Delhi', 'Saket'],
    verified: true,
  });

  // Setup Service
  const service = await ServiceModelAdapter.createService({
    serviceId: 'SVC-BK-TEST',
    serviceName: 'Skilled Bedside Nursing Care',
    description: 'Post-op monitoring and medication assistance.',
    durationOptions: ['4 Hours', '8 Hours'],
    price: 900,
    requiredQualification: 'B.Sc Nursing',
    category: 'medical',
  });

  // Setup Patient for User 1
  const patient1 = await PatientModelAdapter.createPatient({
    patientId: 'PT-BK-1',
    linkedUserId: user1.userId,
    fullName: 'Harish Verma',
    age: 80,
    gender: 'Male',
    mobilityStatus: 'assisted',
    emergencyContactName: 'Rohan Verma',
    emergencyContactPhone: '+91 98888 77777',
    address: 'Saket, New Delhi',
  });

  // Setup Patient for User 2
  const patient2 = await PatientModelAdapter.createPatient({
    patientId: 'PT-BK-2',
    linkedUserId: user2.userId,
    fullName: 'Shanti Gupta',
    age: 77,
    gender: 'Female',
    mobilityStatus: 'independent',
    emergencyContactName: 'Ananya Gupta',
    emergencyContactPhone: '+91 98888 66666',
    address: 'Green Park, New Delhi',
  });

  console.log('✓ Test fixtures successfully initialized');

  // -------------------------------------------------------------
  // Test 1: User 1 books Caregiver Sunita on 2026-10-01 for Morning shift
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Valid createBooking (User 1) ---');
  const req1 = createMockReq(user1, {
    patientId: patient1.patientId,
    caregiverId: caregiver.caregiverId,
    serviceId: service.serviceId,
    scheduledDate: '2026-10-01',
    scheduledTime: 'Morning (08:00 AM - 12:00 PM)',
    duration: '4 Hours',
  });
  const res1 = createMockRes();
  await bookingController.createBooking(req1, res1, (e) => { throw e; });

  if (res1.statusCode !== 201 || !res1.data?.data?.bookingId) {
    throw new Error(`Booking creation failed: ${JSON.stringify(res1.data)}`);
  }
  const booking1 = res1.data.data;
  console.log(`✓ Booking created: ${booking1.bookingId} for ${booking1.scheduledDate} at ${booking1.scheduledTime} (Status: ${booking1.status})`);

  // -------------------------------------------------------------
  // Test 2: Double-Booking Conflict Prevention
  // User 2 attempts to book the SAME caregiver on the SAME date & time
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Double-Booking Conflict Prevention (User 2 on same slot) ---');
  const req2 = createMockReq(user2, {
    patientId: patient2.patientId,
    caregiverId: caregiver.caregiverId,
    serviceId: service.serviceId,
    scheduledDate: '2026-10-01',
    scheduledTime: 'Morning (08:00 AM - 12:00 PM)',
    duration: '4 Hours',
  });
  const res2 = createMockRes();
  await bookingController.createBooking(req2, res2, () => {});

  if (res2.statusCode !== 409 || res2.data?.code !== 'SLOT_ALREADY_BOOKED') {
    throw new Error(`Expected 409 Conflict, got statusCode: ${res2.statusCode}, body: ${JSON.stringify(res2.data)}`);
  }
  console.log(`✓ Conflict successfully caught! 409 returned with message:\n  "${res2.data.message}"`);

  // -------------------------------------------------------------
  // Test 3: Security Guard - User cannot book using someone else's patient
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Security Guard: Patient Ownership ---');
  const imposterReq = createMockReq(user2, {
    patientId: patient1.patientId, // Patient 1 belongs to User 1!
    caregiverId: caregiver.caregiverId,
    serviceId: service.serviceId,
    scheduledDate: '2026-10-02',
    scheduledTime: 'Morning (08:00 AM - 12:00 PM)',
    duration: '4 Hours',
  });
  const imposterRes = createMockRes();
  await bookingController.createBooking(imposterReq, imposterRes, () => {});

  if (imposterRes.statusCode !== 403) {
    throw new Error(`Expected 403 Forbidden when booking someone else's patient, got: ${imposterRes.statusCode}`);
  }
  console.log(`✓ Security guard correctly denied unauthorized patient booking with 403:\n  "${imposterRes.data.message}"`);

  // -------------------------------------------------------------
  // Test 4: Check Caregiver Availability API
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing checkCaregiverAvailability API ---');
  const availReq = createMockReq(user1, {}, {}, {
    caregiverId: caregiver.caregiverId,
    date: '2026-10-01',
  });
  const availRes = createMockRes();
  await bookingController.checkCaregiverAvailability(availReq, availRes, (e) => { throw e; });

  if (availRes.statusCode !== 200 || availRes.data.bookedSlots.length !== 1) {
    throw new Error(`checkCaregiverAvailability failed: ${JSON.stringify(availRes.data)}`);
  }
  console.log(`✓ Availability API correctly identified 1 booked slot for 2026-10-01: ${availRes.data.bookedSlots[0].scheduledTime}`);

  // -------------------------------------------------------------
  // Test 5: Status Transitions
  // Caregiver accepts shift (pending -> confirmed)
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Status Transition: Caregiver Accepts Shift ---');
  const acceptReq = createMockReq(cgUser, { status: 'confirmed' }, { id: booking1.bookingId });
  const acceptRes = createMockRes();
  await bookingController.updateBookingStatus(acceptReq, acceptRes, (e) => { throw e; });

  if (acceptRes.statusCode !== 200 || acceptRes.data.data.status !== 'confirmed') {
    throw new Error(`Status update failed: ${JSON.stringify(acceptRes.data)}`);
  }
  console.log(`✓ Booking status transitioned to: ${acceptRes.data.data.status}`);

  // -------------------------------------------------------------
  // Test 6: Family User Cancels Shift
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Status Transition: User Cancels Shift ---');
  const cancelReq = createMockReq(user1, { status: 'cancelled' }, { id: booking1.bookingId });
  const cancelRes = createMockRes();
  await bookingController.updateBookingStatus(cancelReq, cancelRes, (e) => { throw e; });

  if (cancelRes.statusCode !== 200 || cancelRes.data.data.status !== 'cancelled') {
    throw new Error(`Cancel failed: ${JSON.stringify(cancelRes.data)}`);
  }
  console.log(`✓ Booking status transitioned to: ${cancelRes.data.data.status}`);

  // -------------------------------------------------------------
  // Test 7: Once cancelled, slot is freed up for another user!
  // User 2 books the now-cancelled slot
  // -------------------------------------------------------------
  console.log('\n--- 7. Testing Freed Slot: User 2 can now book the cancelled time slot ---');
  const rebookReq = createMockReq(user2, {
    patientId: patient2.patientId,
    caregiverId: caregiver.caregiverId,
    serviceId: service.serviceId,
    scheduledDate: '2026-10-01',
    scheduledTime: 'Morning (08:00 AM - 12:00 PM)',
    duration: '4 Hours',
  });
  const rebookRes = createMockRes();
  await bookingController.createBooking(rebookReq, rebookRes, (e) => { throw e; });

  if (rebookRes.statusCode !== 201) {
    throw new Error(`Rebook on freed slot failed: ${JSON.stringify(rebookRes.data)}`);
  }
  console.log(`✓ User 2 successfully booked the freed slot! Booking ID: ${rebookRes.data.data.bookingId}`);

  console.log('\n🎉 ALL 7 PHASE 4 BOOKING & CONFLICT PREVENTION TESTS PASSED! 🎉\n');
}

runBookingTestSuite().catch((err) => {
  console.error('❌ Test Suite Failed:', err);
  process.exit(1);
});
