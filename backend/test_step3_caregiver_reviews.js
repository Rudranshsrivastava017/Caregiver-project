/**
 * Test Suite: Step 3 Caregiver Rating & Reviews System
 * Tests:
 * 1. Submit review on completed booking (201 Created)
 * 2. Automatic calculation of caregiver weighted rating and reviewsCount increment
 * 3. Booking marked as reviewed (isReviewed: true, reviewId)
 * 4. Duplicate review prevention on same booking (400 Bad Request)
 * 5. Incomplete booking review rejection (status !== 'completed' returns 400)
 * 6. Ownership security guard: non-owner cannot review booking (403 Forbidden)
 * 7. Invalid rating score validation (score outside 1-5 returns 400 INVALID_INPUT)
 * 8. Caregiver reviews listing endpoint (getCaregiverReviews)
 * 9. Booking review fetch endpoint (getBookingReview)
 */

const assert = require('assert');
const { UserModelAdapter } = require('./models/User');
const { PatientModelAdapter } = require('./models/Patient');
const { CaregiverModelAdapter } = require('./models/Caregiver');
const { BookingModelAdapter } = require('./models/Booking');
const { ServiceModelAdapter } = require('./models/Service');
const { ReviewModelAdapter } = require('./models/Review');
const {
  createBookingReview,
  getCaregiverReviews,
  getBookingReview,
} = require('./controllers/reviewController');

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

async function runStep3Tests() {
  console.log('=============================================================');
  console.log('🧪 RUNNING STEP 3: CAREGIVER RATING & REVIEWS SYSTEM TESTS');
  console.log('=============================================================');

  // --- Fixtures Setup ---
  const familyUser1 = await UserModelAdapter.createUser({
    userId: 'USER-REV-FAM-1',
    fullName: 'Arjun Mehta',
    email: 'arjun.mehta@careelderly.org',
    role: 'user',
  });

  const familyUser2 = await UserModelAdapter.createUser({
    userId: 'USER-REV-FAM-2',
    fullName: 'Sneha Patel',
    email: 'sneha.patel@careelderly.org',
    role: 'user',
  });

  const cgUser = await UserModelAdapter.createUser({
    userId: 'USER-REV-CG',
    fullName: 'Nurse Kavita',
    email: 'kavita.nurse@careelderly.org',
    role: 'caregiver',
  });

  const caregiver = await CaregiverModelAdapter.createCaregiver({
    caregiverId: 'CG-REV-TEST',
    linkedUserId: cgUser.userId,
    fullName: 'Nurse Kavita',
    specialization: 'nurse',
    qualification: 'B.Sc Nursing',
    rating: 4.8,
    reviewsCount: 4,
    verified: true,
  });

  const patient = await PatientModelAdapter.createPatient({
    patientId: 'PAT-REV-TEST',
    linkedUserId: familyUser1.userId,
    fullName: 'Gopal Mehta',
    age: 80,
    gender: 'Male',
    mobilityStatus: 'assisted',
  });

  const service = await ServiceModelAdapter.createService({
    serviceId: 'SVC-REV-TEST',
    serviceName: 'Post-Op Nursing Assistance',
    category: 'medical',
    price: 900,
  });

  const completedBooking = await BookingModelAdapter.createBooking({
    bookingId: 'BK-REV-COMPLETED',
    userId: familyUser1.userId,
    patientId: patient.patientId,
    caregiverId: caregiver.caregiverId,
    serviceId: service.serviceId,
    scheduledDate: '2026-10-10',
    scheduledTime: 'Morning (08:00 AM - 12:00 PM)',
    duration: '4 Hours',
    status: 'completed',
    totalPrice: 900,
  });

  const pendingBooking = await BookingModelAdapter.createBooking({
    bookingId: 'BK-REV-PENDING',
    userId: familyUser1.userId,
    patientId: patient.patientId,
    caregiverId: caregiver.caregiverId,
    serviceId: service.serviceId,
    scheduledDate: '2026-10-20',
    scheduledTime: 'Day Shift (08:00 AM - 04:00 PM)',
    duration: '8 Hours',
    status: 'pending',
    totalPrice: 1500,
  });

  // 1. Submit review on completed booking
  console.log('\n▶ [1/9] Testing Review Submission on Completed Shift Booking...');
  const reviewReq1 = {
    user: { userId: familyUser1.userId, fullName: familyUser1.fullName, role: 'user' },
    params: { id: completedBooking.bookingId },
    body: {
      rating: 5,
      comment: 'Nurse Kavita provided gentle, patient, and highly skilled nursing care for my father.',
    },
  };
  const reviewRes1 = createMockRes();
  await createBookingReview(reviewReq1, reviewRes1, (err) => { if (err) throw err; });

  assert.strictEqual(reviewRes1.statusCode, 201, 'Review submission should return 201 Created');
  assert.strictEqual(reviewRes1.responseData.status, 'success');
  assert.strictEqual(reviewRes1.responseData.data.rating, 5);
  assert.strictEqual(reviewRes1.responseData.data.bookingId, completedBooking.bookingId);
  console.log('  ✔ Review submitted successfully! Review ID:', reviewRes1.responseData.data.reviewId);

  // 2. Automatic calculation of caregiver weighted rating and reviewsCount increment
  console.log('\n▶ [2/9] Verifying Caregiver Weighted Rating Calculation...');
  const updatedCaregiver = await CaregiverModelAdapter.findById(caregiver.caregiverId);
  // Expected: ((4.8 * 4) + 5) / 5 = (19.2 + 5) / 5 = 24.2 / 5 = 4.84 -> rounded to 4.8
  assert.strictEqual(updatedCaregiver.reviewsCount, 5, 'reviewsCount should increment to 5');
  assert.strictEqual(updatedCaregiver.rating, 4.8, 'Rating should be correctly weighted to 4.8');
  console.log(`  ✔ Caregiver metrics updated: Rating=${updatedCaregiver.rating}★, ReviewsCount=${updatedCaregiver.reviewsCount}`);

  // 3. Booking marked as reviewed
  console.log('\n▶ [3/9] Verifying Booking is Marked as Reviewed...');
  const updatedBooking = await BookingModelAdapter.findById(completedBooking.bookingId);
  assert.strictEqual(updatedBooking.isReviewed, true, 'Booking should have isReviewed = true');
  assert.ok(updatedBooking.reviewId, 'Booking should be linked to reviewId');
  console.log('  ✔ Booking record reflects reviewed status.');

  // 4. Duplicate review prevention on same booking
  console.log('\n▶ [4/9] Testing Duplicate Review Prevention...');
  const dupReq = {
    user: { userId: familyUser1.userId, fullName: familyUser1.fullName, role: 'user' },
    params: { id: completedBooking.bookingId },
    body: { rating: 4, comment: 'Second attempt' },
  };
  const dupRes = createMockRes();
  await createBookingReview(dupReq, dupRes, (err) => { if (err) throw err; });

  assert.strictEqual(dupRes.statusCode, 400, 'Duplicate review should return 400 Bad Request');
  assert.ok(dupRes.responseData.message.includes('already been submitted'));
  console.log('  ✔ Duplicate review prevented with HTTP 400.');

  // 5. Incomplete booking review rejection
  console.log('\n▶ [5/9] Testing Review Rejection on Incomplete Booking...');
  const pendingReq = {
    user: { userId: familyUser1.userId, fullName: familyUser1.fullName, role: 'user' },
    params: { id: pendingBooking.bookingId },
    body: { rating: 5, comment: 'Premature review' },
  };
  const pendingRes = createMockRes();
  await createBookingReview(pendingReq, pendingRes, (err) => { if (err) throw err; });

  assert.strictEqual(pendingRes.statusCode, 400, 'Incomplete booking should return 400');
  assert.ok(pendingRes.responseData.message.includes('Only completed care shifts can be reviewed'));
  console.log('  ✔ Premature review on pending shift rejected with HTTP 400.');

  // 6. Ownership security guard: non-owner cannot review booking
  console.log('\n▶ [6/9] Testing Security Guard: Non-Owner Cannot Review Booking...');
  // Create another completed booking owned by familyUser1
  const completedBooking2 = await BookingModelAdapter.createBooking({
    bookingId: 'BK-REV-COMPLETED-2',
    userId: familyUser1.userId,
    patientId: patient.patientId,
    caregiverId: caregiver.caregiverId,
    serviceId: service.serviceId,
    scheduledDate: '2026-10-12',
    scheduledTime: 'Evening (04:00 PM - 08:00 PM)',
    duration: '4 Hours',
    status: 'completed',
    totalPrice: 900,
  });

  const unauthReq = {
    user: { userId: familyUser2.userId, fullName: familyUser2.fullName, role: 'user' },
    params: { id: completedBooking2.bookingId },
    body: { rating: 5, comment: 'Unauthorized review' },
  };
  const unauthRes = createMockRes();
  await createBookingReview(unauthReq, unauthRes, (err) => { if (err) throw err; });

  assert.strictEqual(unauthRes.statusCode, 403, 'Non-owner review should return 403 Forbidden');
  assert.ok(unauthRes.responseData.message.includes('authorized to review care shifts booked by your family account'));
  console.log('  ✔ Unauthorized user blocked with HTTP 403 Forbidden.');

  // 7. Invalid rating score validation
  console.log('\n▶ [7/9] Testing Invalid Rating Score Validation...');
  const invalidScoreReq = {
    user: { userId: familyUser1.userId, fullName: familyUser1.fullName, role: 'user' },
    params: { id: completedBooking2.bookingId },
    body: { rating: 6, comment: 'Score over 5' },
  };
  const invalidScoreRes = createMockRes();
  await createBookingReview(invalidScoreReq, invalidScoreRes, (err) => { if (err) throw err; });

  assert.strictEqual(invalidScoreRes.statusCode, 400, 'Rating 6 should return 400');
  assert.strictEqual(invalidScoreRes.responseData.error.code, 'INVALID_INPUT');
  assert.ok(invalidScoreRes.responseData.message.includes('between 1 and 5 stars'));
  console.log('  ✔ Invalid rating score rejected with HTTP 400 INVALID_INPUT.');

  // 8. Caregiver reviews listing endpoint
  console.log('\n▶ [8/9] Testing Caregiver Reviews Fetch API...');
  const getCgReviewsReq = { params: { id: caregiver.caregiverId }, query: {} };
  const getCgReviewsRes = createMockRes();
  await getCaregiverReviews(getCgReviewsReq, getCgReviewsRes, (err) => { if (err) throw err; });

  assert.strictEqual(getCgReviewsRes.statusCode, 200, 'Caregiver reviews should return 200');
  assert.ok(getCgReviewsRes.responseData.data.length >= 1, 'Should return at least 1 review');
  assert.strictEqual(getCgReviewsRes.responseData.data[0].caregiverId, caregiver.caregiverId);
  console.log('  ✔ Caregiver reviews listing retrieved successfully. Total reviews:', getCgReviewsRes.responseData.count);

  // 9. Booking review fetch endpoint
  console.log('\n▶ [9/9] Testing Booking Review Fetch API...');
  const getBkReviewReq = { params: { id: completedBooking.bookingId } };
  const getBkReviewRes = createMockRes();
  await getBookingReview(getBkReviewReq, getBkReviewRes, (err) => { if (err) throw err; });

  assert.strictEqual(getBkReviewRes.statusCode, 200);
  assert.strictEqual(getBkReviewRes.responseData.isReviewed, true);
  assert.strictEqual(getBkReviewRes.responseData.data.rating, 5);
  console.log('  ✔ Booking review fetch accurately reports review status and data.');

  console.log('\n=============================================================');
  console.log('🎉 ALL 9 STEP 3 CAREGIVER REVIEW TESTS PASSED 100%! 🎉');
  console.log('=============================================================\n');
}

runStep3Tests().catch((err) => {
  console.error('❌ Step 3 Test failed:', err);
  process.exit(1);
});
