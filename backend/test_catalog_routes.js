const serviceController = require('./controllers/serviceController');
const caregiverController = require('./controllers/caregiverController');
const { ServiceModelAdapter } = require('./models/Service');
const { CaregiverModelAdapter } = require('./models/Caregiver');

// Mock request and response helpers
const createMockReq = (params = {}, query = {}, body = {}) => ({
  params,
  query,
  body,
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

async function runCatalogTestSuite() {
  console.log('=== STARTING PHASE 3: CATALOG & CAREGIVER INTEGRATION TESTS ===\n');

  // Seed sample services if not already seeded
  await ServiceModelAdapter.createService({
    serviceId: 'SVC001',
    serviceName: 'Elderly Home Nursing Care',
    description: 'Skilled nursing support for medication management and vital monitoring.',
    durationOptions: ['4 hr', '12 hr', '24 hr'],
    price: 800,
    requiredQualification: 'B.Sc Nursing / GNM',
    category: 'medical',
  });

  await ServiceModelAdapter.createService({
    serviceId: 'SVC002',
    serviceName: 'Physiotherapy Session',
    description: 'In-home physiotherapy for mobility recovery.',
    durationOptions: ['1 hr'],
    price: 600,
    requiredQualification: 'Doctor of Physiotherapy (DPT/BPT)',
    category: 'rehabilitation',
  });

  // Seed sample caregiver
  await CaregiverModelAdapter.createCaregiver({
    caregiverId: 'CG-201',
    linkedUserId: 'USER-002',
    fullName: 'Anita Sharma, RN',
    specialization: 'nurse',
    qualification: 'B.Sc Nursing',
    yearsExperience: 8,
    rating: 4.9,
    reviewsCount: 34,
    serviceAreas: ['South Delhi', 'Green Park', 'Saket'],
    verified: true,
    bio: 'Compassionate registered nurse with 8+ years experience.',
    photoUrl: 'https://images.unsplash.com/photo-1594824813566-88855ce7890b?auto=format&fit=crop&w=300&q=80',
  });

  await CaregiverModelAdapter.createCaregiver({
    caregiverId: 'CG-202',
    linkedUserId: 'USER-003',
    fullName: 'Dr. Rajesh Verma (PT)',
    specialization: 'physiotherapist',
    qualification: 'Bachelor of Physiotherapy (BPT)',
    yearsExperience: 6,
    rating: 4.8,
    reviewsCount: 29,
    serviceAreas: ['Vasant Kunj', 'Saket'],
    verified: true,
    bio: 'Specialist in orthopedic physiotherapy.',
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
  });

  // 1. Test Get Services (All)
  console.log('--- 1. Testing getServices (All) ---');
  const req1 = createMockReq();
  const res1 = createMockRes();
  await serviceController.getServices(req1, res1, (e) => { throw e; });
  if (res1.statusCode !== 200 || res1.data.count < 2) {
    throw new Error(`getServices failed: count ${res1.data?.count}`);
  }
  console.log(`✓ Fetched ${res1.data.count} services successfully`);

  // 2. Test Get Services by Category
  console.log('\n--- 2. Testing getServices Filter by Category ---');
  const req2 = createMockReq({}, { category: 'medical' });
  const res2 = createMockRes();
  await serviceController.getServices(req2, res2, (e) => { throw e; });
  const allMedical = res2.data.data.every((s) => s.category === 'medical');
  if (!allMedical) {
    throw new Error('Category filter failed');
  }
  console.log(`✓ Filtered category 'medical' returned ${res2.data.count} items, all verified`);

  // 3. Test Get Service by ID
  console.log('\n--- 3. Testing getServiceById ---');
  const req3 = createMockReq({ id: 'SVC001' });
  const res3 = createMockRes();
  await serviceController.getServiceById(req3, res3, (e) => { throw e; });
  if (res3.statusCode !== 200 || res3.data.data.serviceName !== 'Elderly Home Nursing Care') {
    throw new Error('getServiceById failed');
  }
  console.log(`✓ Fetched service by ID: ${res3.data.data.serviceName}`);

  // 4. Test Get Caregivers (All verified)
  console.log('\n--- 4. Testing getCaregivers (Verified listing) ---');
  const req4 = createMockReq();
  const res4 = createMockRes();
  await caregiverController.getCaregivers(req4, res4, (e) => { throw e; });
  if (res4.statusCode !== 200 || res4.data.count < 2) {
    throw new Error(`getCaregivers failed: count ${res4.data?.count}`);
  }
  console.log(`✓ Fetched ${res4.data.count} verified caregivers`);

  // 5. Test Caregivers Filter by Specialization
  console.log('\n--- 5. Testing getCaregivers Filter by Specialization ---');
  const req5 = createMockReq({}, { specialization: 'nurse' });
  const res5 = createMockRes();
  await caregiverController.getCaregivers(req5, res5, (e) => { throw e; });
  const allNurses = res5.data.data.every((c) => c.specialization === 'nurse');
  if (!allNurses || res5.data.count === 0) {
    throw new Error('Specialization filter failed');
  }
  console.log(`✓ Filtered specialization 'nurse' returned ${res5.data.count} caregivers`);

  // 6. Test Caregivers Filter by Location
  console.log('\n--- 6. Testing getCaregivers Filter by Location ---');
  const req6 = createMockReq({}, { location: 'Saket' });
  const res6 = createMockRes();
  await caregiverController.getCaregivers(req6, res6, (e) => { throw e; });
  if (res6.data.count < 2) {
    throw new Error('Location filter failed');
  }
  console.log(`✓ Filtered location 'Saket' matched ${res6.data.count} caregivers`);

  // 7. Test Caregivers Filter by Minimum Rating
  console.log('\n--- 7. Testing getCaregivers Filter by Minimum Rating ---');
  const req7 = createMockReq({}, { minRating: '4.85' });
  const res7 = createMockRes();
  await caregiverController.getCaregivers(req7, res7, (e) => { throw e; });
  if (res7.data.count !== 1 || res7.data.data[0].caregiverId !== 'CG-201') {
    throw new Error('Rating filter failed');
  }
  console.log(`✓ Filtered minRating 4.85+ isolated top-rated caregiver ${res7.data.data[0].fullName} (${res7.data.data[0].rating}★)`);

  // 8. Test Get Caregiver by ID
  console.log('\n--- 8. Testing getCaregiverById ---');
  const req8 = createMockReq({ id: 'CG-201' });
  const res8 = createMockRes();
  await caregiverController.getCaregiverById(req8, res8, (e) => { throw e; });
  if (res8.statusCode !== 200 || res8.data.data.fullName !== 'Anita Sharma, RN') {
    throw new Error('getCaregiverById failed');
  }
  console.log(`✓ Retrieved caregiver profile: ${res8.data.data.fullName}`);

  console.log('\n🎉 ALL 8 CATALOG & CAREGIVER TESTS PASSED CLEANLY & SUCCESSFULLY! 🎉\n');
}

runCatalogTestSuite().catch((err) => {
  console.error('❌ Test Suite Failed:', err);
  process.exit(1);
});
