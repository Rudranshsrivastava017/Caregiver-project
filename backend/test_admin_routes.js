const assert = require('assert');
const adminController = require('./controllers/adminController');
const caregiverController = require('./controllers/caregiverController');
const { UserModelAdapter } = require('./models/User');
const { CaregiverModelAdapter } = require('./models/Caregiver');
const { PatientModelAdapter } = require('./models/Patient');
const { BookingModelAdapter } = require('./models/Booking');
const { ServiceModelAdapter } = require('./models/Service');
const { roleGuard } = require('./middlewares/roleMiddleware');

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

async function runPhase6TestSuite() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING PHASE 6: ADMIN VERIFICATION & ANALYTICS TEST SUITE');
  console.log('=============================================================\n');

  try {
    // 1. Setup Test Fixtures
    console.log('▶ [1/7] Setting up admin, family, and caregiver test records...');

    const adminUser = await UserModelAdapter.createUser({
      userId: 'ADMIN-TEST-001',
      fullName: 'Head Administrator',
      email: 'admin.test@careelderly.org',
      role: 'admin',
      verificationStatus: 'approved',
    });

    const familyUser = await UserModelAdapter.createUser({
      userId: 'USER-TEST-FAMILY',
      fullName: 'Rahul Verma',
      email: 'rahul.verma@careelderly.org',
      role: 'user',
    });

    const pendingUser = await UserModelAdapter.createUser({
      userId: 'CG-TEST-PENDING',
      fullName: 'Meera Sen, RN',
      email: 'meera.nurse@careelderly.org',
      role: 'caregiver',
      verificationStatus: 'pending',
      legalIdNumber: 'MED-REG-8821',
      legalIdVerified: false,
    });

    const pendingCaregiver = await CaregiverModelAdapter.createCaregiver({
      caregiverId: 'CG-PROF-PENDING',
      linkedUserId: pendingUser.userId,
      fullName: 'Meera Sen, RN',
      specialization: 'nurse',
      qualification: 'B.Sc Nursing',
      yearsExperience: 5,
      certificationDocsUrl: ['https://example.com/docs/meera_license.pdf'],
      verified: false,
      rating: 0,
      serviceAreas: ['South Delhi'],
    });

    // Seed dummy patient and booking for analytics verification
    const testPatient = await PatientModelAdapter.createPatient({
      linkedUserId: familyUser.userId,
      fullName: 'Dharampal Verma',
      age: 80,
      gender: 'Male',
      mobilityStatus: 'assisted',
      emergencyContactName: 'Rahul Verma',
      emergencyContactPhone: '+91 98888 12345',
      address: 'Delhi',
    });

    const testBooking = await BookingModelAdapter.createBooking({
      userId: familyUser.userId,
      patientId: testPatient.patientId,
      caregiverId: pendingCaregiver.caregiverId,
      serviceId: 'SVC001',
      scheduledDate: '2026-10-15',
      scheduledTime: 'Morning',
      duration: '4 hr',
      status: 'confirmed',
      totalPrice: 800,
    });

    console.log('  ✔ Test fixtures created successfully.');

    // 2. Test RBAC: Non-admin users are blocked from admin routes
    console.log('\n▶ [2/7] Testing RBAC: Non-admin users cannot access admin endpoints...');
    const adminGuard = roleGuard(['admin']);

    let familyBlocked = false;
    const familyReq = createMockReq({ userId: familyUser.userId, role: familyUser.role });
    const familyRes = createMockRes();
    adminGuard(familyReq, familyRes, (err) => {
      if (err) familyBlocked = true;
    });
    if (familyRes.statusCode === 403) familyBlocked = true;
    assert.ok(familyBlocked, 'Family user must receive 403 Forbidden on admin routes');
    console.log('  ✔ Family user blocked with 403 Forbidden.');

    let caregiverBlocked = false;
    const cgReq = createMockReq({ userId: pendingUser.userId, role: pendingUser.role });
    const cgRes = createMockRes();
    adminGuard(cgReq, cgRes, (err) => {
      if (err) caregiverBlocked = true;
    });
    if (cgRes.statusCode === 403) caregiverBlocked = true;
    assert.ok(caregiverBlocked, 'Caregiver user must receive 403 Forbidden on admin routes');
    console.log('  ✔ Caregiver user blocked with 403 Forbidden.');

    // 3. Admin gets list of pending caregivers
    console.log('\n▶ [3/7] Admin retrieves list of pending caregiver applications...');
    const adminReq = createMockReq({ userId: adminUser.userId, role: 'admin' });
    const pendingRes = createMockRes();
    await adminController.getPendingCaregivers(adminReq, pendingRes, (err) => { throw err; });

    assert.strictEqual(pendingRes.statusCode, 200, 'Should return 200 OK');
    assert.strictEqual(pendingRes.data.status, 'success');
    assert.ok(pendingRes.data.data.length >= 1, 'Should return at least 1 pending caregiver');
    const meeraItem = pendingRes.data.data.find((item) => item.user.userId === pendingUser.userId);
    assert.ok(meeraItem, 'Meera Sen should be in pending caregiver list');
    assert.strictEqual(meeraItem.caregiverProfile.qualification, 'B.Sc Nursing');
    console.log(`  ✔ Pending queue returned ${pendingRes.data.data.length} applicant(s). Applicant: ${meeraItem.user.fullName}`);

    // 4. Admin retrieves platform analytics
    console.log('\n▶ [4/7] Admin retrieves aggregate platform analytics...');
    const analyticsRes = createMockRes();
    await adminController.getAdminAnalytics(adminReq, analyticsRes, (err) => { throw err; });

    assert.strictEqual(analyticsRes.statusCode, 200, 'Should return 200 OK');
    assert.strictEqual(analyticsRes.data.status, 'success');
    const { users, patients, bookings, services } = analyticsRes.data.data;
    assert.ok(users.totalUsers >= 3, 'Should reflect total users');
    assert.ok(users.pendingCaregivers >= 1, 'Should count pending caregivers');
    assert.ok(patients.totalPatients >= 1, 'Should count patients');
    assert.ok(bookings.totalBookings >= 1, 'Should count bookings');
    assert.ok(bookings.activeBookings >= 1, 'Should count active bookings');
    console.log('  ✔ Platform analytics verified:');
    console.log(`     - Users: ${users.totalUsers} (Family: ${users.familyUsers}, Caregivers: ${users.totalCaregivers}, Pending: ${users.pendingCaregivers})`);
    console.log(`     - Patients: ${patients.totalPatients}`);
    console.log(`     - Bookings: ${bookings.totalBookings} (Active: ${bookings.activeBookings}, Confirmed: ${bookings.confirmed})`);

    // 5. Admin approves caregiver application
    console.log('\n▶ [5/7] Admin approves Meera Sen credentials...');
    const approveReq = createMockReq({ userId: adminUser.userId, role: 'admin' }, { decision: 'approved' }, { id: pendingUser.userId });
    const approveRes = createMockRes();
    await adminController.verifyCaregiver(approveReq, approveRes, (err) => { throw err; });

    assert.strictEqual(approveRes.statusCode, 200, 'Should return 200 OK on approve');
    assert.strictEqual(approveRes.data.status, 'success');
    assert.strictEqual(approveRes.data.data.verificationStatus, 'approved');
    assert.strictEqual(approveRes.data.data.legalIdVerified, true);

    const updatedUser = await UserModelAdapter.findById(pendingUser.userId);
    assert.strictEqual(updatedUser.verificationStatus, 'approved', 'User model verificationStatus should be approved');
    assert.strictEqual(updatedUser.legalIdVerified, true, 'User model legalIdVerified should be true');

    const updatedCaregiver = await CaregiverModelAdapter.findByUserId(pendingUser.userId);
    assert.strictEqual(updatedCaregiver.verified, true, 'Caregiver profile verified should be true');
    console.log('  ✔ Caregiver credentials approved & synchronized across User and Caregiver models.');

    // 6. Admin rejects a sample application with reason
    console.log('\n▶ [6/7] Testing Admin rejection workflow with feedback reason...');
    const rejectUser = await UserModelAdapter.createUser({
      userId: 'CG-TEST-REJECT',
      fullName: 'Incomplete Applicant',
      email: 'incomplete@careelderly.org',
      role: 'caregiver',
      verificationStatus: 'pending',
    });
    await CaregiverModelAdapter.createCaregiver({
      caregiverId: 'CG-PROF-REJECT',
      linkedUserId: rejectUser.userId,
      fullName: 'Incomplete Applicant',
      specialization: 'attendant',
      verified: false,
    });

    const rejectReq = createMockReq(
      { userId: adminUser.userId, role: 'admin' },
      { reason: 'Nursing council registration document is expired. Please re-upload current certification.' },
      { id: rejectUser.userId }
    );
    const rejectRes = createMockRes();
    await adminController.rejectCaregiver(rejectReq, rejectRes, (err) => { throw err; });

    assert.strictEqual(rejectRes.statusCode, 200, 'Should return 200 OK on reject');
    assert.strictEqual(rejectRes.data.data.verificationStatus, 'rejected');
    assert.strictEqual(rejectRes.data.data.legalIdVerified, false);
    assert.ok(rejectRes.data.data.reason.includes('Nursing council registration document is expired'));
    console.log('  ✔ Caregiver application rejected with administrative feedback.');

    // 7. Verify Caregiver Directory reflects approved caregiver
    console.log('\n▶ [7/7] Verifying approved caregiver appears in directory listings...');
    const catReq = createMockReq({}, {}, {}, { specialization: 'nurse' });
    const catRes = createMockRes();
    await caregiverController.getCaregivers(catReq, catRes, (err) => { throw err; });

    assert.strictEqual(catRes.statusCode, 200);
    const meeraInCatalog = catRes.data.data.find((cg) => cg.fullName === 'Meera Sen, RN');
    assert.ok(meeraInCatalog, 'Approved caregiver should now be returned in public catalog');
    console.log('  ✔ Newly verified nurse Meera Sen is active and visible in public directory.');

    console.log('\n=============================================================');
    console.log('🎉 ALL 7 PHASE 6 ADMIN PORTAL & ANALYTICS TESTS PASSED CLEANLY!');
    console.log('=============================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Phase 6 Test Failed:', error);
    process.exit(1);
  }
}

runPhase6TestSuite();
