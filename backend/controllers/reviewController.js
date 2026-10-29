const { ReviewModelAdapter } = require('../models/Review');
const { BookingModelAdapter } = require('../models/Booking');
const { CaregiverModelAdapter } = require('../models/Caregiver');
const { UserModelAdapter } = require('../models/User');
const { ServiceModelAdapter } = require('../models/Service');

/**
 * 1. Submit Rating and Review for a completed care shift booking
 * POST /api/v1/bookings/:id/review or POST /api/v1/reviews
 */
const createBookingReview = async (req, res, next) => {
  try {
    const bookingId = req.params.id || req.body.bookingId;
    const { rating, comment } = req.body;

    // 1. Validate booking ID
    if (!bookingId) {
      return res.status(400).json({
        status: 'fail',
        error: { code: 'INVALID_INPUT', message: 'Booking ID is required to submit a review.' },
        message: 'Booking ID is required to submit a review.',
      });
    }

    // 2. Validate rating score
    const ratingNum = Number(rating);
    if (!rating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        status: 'fail',
        error: { code: 'INVALID_INPUT', message: 'Rating must be a numeric score between 1 and 5 stars.' },
        message: 'Rating must be a numeric score between 1 and 5 stars.',
      });
    }

    // 3. Find booking
    const booking = await BookingModelAdapter.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: 'fail',
        message: 'Booking shift record not found.',
      });
    }

    // 4. Shift must be in 'completed' status
    if (booking.status !== 'completed') {
      return res.status(400).json({
        status: 'fail',
        message: `Only completed care shifts can be reviewed. Current booking status is '${booking.status}'.`,
      });
    }

    // 5. Caller must be the family user who booked the shift (or platform admin)
    const isOwner = req.user && (booking.userId === req.user.userId || req.user.role === 'admin');
    if (!isOwner) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are only authorized to review care shifts booked by your family account.',
      });
    }

    // 6. Check if this booking has already been reviewed
    const existingReview = await ReviewModelAdapter.findByBookingId(booking.bookingId || bookingId);
    if (existingReview) {
      return res.status(400).json({
        status: 'fail',
        message: 'A review has already been submitted for this care shift.',
      });
    }

    // 7. Find Caregiver and calculate updated rating
    const caregiver = await CaregiverModelAdapter.findById(booking.caregiverId);
    let newRating = Math.round(ratingNum * 10) / 10;
    let newReviewsCount = 1;

    if (caregiver) {
      const currentRating = typeof caregiver.rating === 'number' ? caregiver.rating : 5.0;
      const currentCount = typeof caregiver.reviewsCount === 'number' ? caregiver.reviewsCount : 0;

      if (currentCount > 0) {
        newReviewsCount = currentCount + 1;
        newRating = Math.round(((currentRating * currentCount + ratingNum) / newReviewsCount) * 10) / 10;
      } else {
        newRating = Math.round(ratingNum * 10) / 10;
        newReviewsCount = 1;
      }

      // Update caregiver record in database / in-memory store
      await CaregiverModelAdapter.updateCaregiver(caregiver.caregiverId, {
        rating: newRating,
        reviewsCount: newReviewsCount,
      });
    }

    // 8. Fetch user details for display
    let reviewerName = req.user.fullName || 'Family Member';
    let reviewerPhoto = null;
    if (req.user.userId) {
      const user = await UserModelAdapter.findById(req.user.userId);
      if (user) {
        reviewerName = user.fullName || reviewerName;
        reviewerPhoto = user.profilePhotoUrl || null;
      }
    }

    // Fetch service title
    let serviceName = 'Healthcare Service';
    if (booking.serviceId) {
      const service = await ServiceModelAdapter.findById(booking.serviceId);
      if (service) serviceName = service.serviceName;
    }

    // 9. Create review record
    const reviewId = `REV-${Date.now().toString().slice(-6)}`;
    const newReview = await ReviewModelAdapter.createReview({
      reviewId,
      bookingId: booking.bookingId || bookingId,
      caregiverId: booking.caregiverId,
      userId: req.user.userId,
      userName: reviewerName,
      userPhoto: reviewerPhoto,
      rating: ratingNum,
      comment: comment ? String(comment).trim() : '',
      serviceName,
    });

    // 10. Update booking with review metadata
    await BookingModelAdapter.updateBooking(booking.bookingId || bookingId, {
      isReviewed: true,
      reviewId: newReview.reviewId,
      rating: ratingNum,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Thank you for your feedback! Caregiver review recorded.',
      data: newReview,
      caregiverSummary: {
        caregiverId: booking.caregiverId,
        newRating,
        reviewsCount: newReviewsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get reviews for a specific caregiver
 * GET /api/v1/caregivers/:id/reviews or GET /api/v1/reviews/caregiver/:caregiverId
 */
const getCaregiverReviews = async (req, res, next) => {
  try {
    const caregiverId = req.params.id || req.params.caregiverId;

    if (!caregiverId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Caregiver ID is required.',
      });
    }

    const reviews = await ReviewModelAdapter.findByCaregiverId(caregiverId);

    // Optional query pagination
    const { page, limit } = req.query;
    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const total = reviews.length;
      const totalPages = Math.ceil(total / limitNum) || 1;
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedData = reviews.slice(startIndex, startIndex + limitNum);

      return res.status(200).json({
        status: 'success',
        count: paginatedData.length,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        data: paginatedData,
      });
    }

    return res.status(200).json({
      status: 'success',
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get review for a specific booking
 * GET /api/v1/bookings/:id/review or GET /api/v1/reviews/booking/:bookingId
 */
const getBookingReview = async (req, res, next) => {
  try {
    const bookingId = req.params.id || req.params.bookingId;

    if (!bookingId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Booking ID is required.',
      });
    }

    const review = await ReviewModelAdapter.findByBookingId(bookingId);

    return res.status(200).json({
      status: 'success',
      data: review || null,
      isReviewed: !!review,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBookingReview,
  getCaregiverReviews,
  getBookingReview,
};
