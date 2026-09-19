const { UserModelAdapter } = require('./models/User');
const { PatientModelAdapter } = require('./models/Patient');
const { CaregiverModelAdapter } = require('./models/Caregiver');
const { ServiceModelAdapter } = require('./models/Service');
const { BookingModelAdapter } = require('./models/Booking');
const { CareNoteModelAdapter } = require('./models/CareNote');
const { generateAccessToken, generateRefreshToken } = require('./utils/tokenUtils');

async function testSuite() {
  console.log('--- TESTING BACKEND ARCHITECTURE & MODELS ---');
  
  // 1. User & Auth Test
  const testUser = await UserModelAdapter.createUser({
    userId: 'TEST-USER-1',
    fullName: 'Test User',
    email: 'test@elderlycare.org',
    passwordHash: 'password123',
    role: 'user',
  });
  console.log('1. User Created:', testUser.userId, testUser.email);

  const token = generateAccessToken(testUser);
  console.log('2. Access Token Generated (length):', token.length);

  // 2. Patient Test
  const patient = await PatientModelAdapter.createPatient({
    linkedUserId: testUser.userId,
    fullName: 'Elderly Patient A',
    age: 82,
    gender: 'Male',
    medicalHistory: 'Parkinsons Stage 2',
    mobilityStatus: 'assisted',
    emergencyContactName: 'Test Son',
    emergencyContactPhone: '+91 99999 11111',
    address: 'Sector 15, Chandigarh',
  });
  console.log('3. Patient Created:', patient.patientId, patient.fullName);

  // 3. Caregiver Test
  const caregiver = await CaregiverModelAdapter.createCaregiver({
    linkedUserId: 'CG-TEST-1',
    fullName: 'Nurse Kavita',
    specialization: 'nurse',
    qualification: 'B.Sc Nursing',
    yearsExperience: 6,
    verified: true,
  });
  console.log('4. Caregiver Created:', caregiver.caregiverId, caregiver.fullName, 'Specialization:', caregiver.specialization);

  // 4. Service Test
  const service = await ServiceModelAdapter.createService({
    serviceName: '12h Night Nursing Care',
    description: 'Overnight patient monitoring and care.',
    durationOptions: ['12 Hours'],
    price: 1500,
    requiredQualification: 'GNM Nursing',
    category: 'medical',
  });
  console.log('5. Service Created:', service.serviceId, service.serviceName, 'Price:', service.price);

  // 5. Booking Test (No Payment Gateway, totalPrice as display estimate)
  const booking = await BookingModelAdapter.createBooking({
    userId: testUser.userId,
    patientId: patient.patientId,
    caregiverId: caregiver.caregiverId,
    serviceId: service.serviceId,
    scheduledDate: '2026-09-05',
    scheduledTime: '08:00 PM - 08:00 AM',
    duration: '12 Hours',
    status: 'pending',
    totalPrice: 1500,
  });
  console.log('6. Booking Created:', booking.bookingId, 'Status:', booking.status, 'Estimated Price:', booking.totalPrice);

  // 6. Care Note Test
  const careNote = await CareNoteModelAdapter.createCareNote({
    bookingId: booking.bookingId,
    caregiverId: caregiver.caregiverId,
    patientId: patient.patientId,
    vitals: { bp: '120/80', pulse: '72', temperature: '98.4', sugarLevel: '105' },
    tasksPerformed: ['Night medicine administered', 'Assisted mobility to restroom'],
    observations: 'Patient had restful sleep with normal vital signs.',
  });
  console.log('7. Care Note Logged:', careNote.noteId, 'Vitals BP:', careNote.vitals.bp);

  console.log('\n>>> ALL 7 CORE DOMAIN ARCHITECTURE TESTS PASSED SUCCESSFULLY! <<<');
}

testSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
