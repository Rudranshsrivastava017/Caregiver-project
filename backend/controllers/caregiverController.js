const { CaregiverModelAdapter } = require('../models/Caregiver');
const { BookingModelAdapter } = require('../models/Booking');

// 1. Get filtered list of verified caregivers
const getCaregivers = async (req, res, next) => {
  try {
    const { specialization, service, location, minRating, rating, verified } = req.query;

    let caregivers = await CaregiverModelAdapter.find();

    // Default to verified caregivers unless explicitly requested otherwise
    if (verified !== 'all' && verified !== 'false') {
      caregivers = caregivers.filter((cg) => cg.verified === true);
    }

    // Filter by Specialization / Service Category
    const targetSpec = specialization || service;
    if (targetSpec && targetSpec !== 'all') {
      caregivers = caregivers.filter(
        (cg) => cg.specialization?.toLowerCase() === targetSpec.toLowerCase()
      );
    }

    // Filter by Locality / Service Area
    if (location && location.trim() !== '') {
      const locLower = location.trim().toLowerCase();
      caregivers = caregivers.filter((cg) => {
        const inAreas = Array.isArray(cg.serviceAreas)
          ? cg.serviceAreas.some((area) => area.toLowerCase().includes(locLower))
          : false;
        const inBio = cg.bio ? cg.bio.toLowerCase().includes(locLower) : false;
        return inAreas || inBio;
      });
    }

    // Filter by Minimum Rating
    const thresholdRating = minRating || rating;
    if (thresholdRating && !isNaN(parseFloat(thresholdRating))) {
      const min = parseFloat(thresholdRating);
      caregivers = caregivers.filter((cg) => (cg.rating || 0) >= min);
    }

    // Enrich with active booking status & amount
    const allBookings = await BookingModelAdapter.find();
    const activeBookings = allBookings.filter((b) =>
      ['pending', 'confirmed', 'in_progress'].includes(b.status)
    );

    const enrichedCaregivers = caregivers.map((cg) => {
      const cgId = cg.caregiverId || cg._id;
      const linkedId = cg.linkedUserId;
      const cgBookings = activeBookings.filter(
        (b) => b.caregiverId === cgId || (linkedId && b.caregiverId === linkedId)
      );
      const isBooked = cgBookings.length > 0;
      const raw = typeof cg.toObject === 'function' ? cg.toObject() : { ...cg };
      return {
        ...raw,
        amount: raw.amount || raw.rate || raw.hourlyRate || 500,
        rate: raw.rate || raw.amount || 500,
        isBooked,
        status: isBooked ? 'booked' : 'available',
        activeBookingsCount: cgBookings.length,
      };
    });

    return res.status(200).json({
      status: 'success',
      count: enrichedCaregivers.length,
      data: enrichedCaregivers,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get single caregiver detailed profile by ID
const getCaregiverById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let caregiver = await CaregiverModelAdapter.findById(id);

    if (!caregiver) {
      caregiver = await CaregiverModelAdapter.findByUserId(id);
    }

    if (!caregiver) {
      return res.status(404).json({
        status: 'fail',
        message: 'Caregiver profile not found.',
      });
    }

    const allBookings = await BookingModelAdapter.find();
    const activeBookings = allBookings.filter(
      (b) =>
        ['pending', 'confirmed', 'in_progress'].includes(b.status) &&
        (b.caregiverId === caregiver.caregiverId || (caregiver.linkedUserId && b.caregiverId === caregiver.linkedUserId))
    );
    const isBooked = activeBookings.length > 0;
    const raw = typeof caregiver.toObject === 'function' ? caregiver.toObject() : { ...caregiver };

    return res.status(200).json({
      status: 'success',
      data: {
        ...raw,
        amount: raw.amount || raw.rate || raw.hourlyRate || 500,
        rate: raw.rate || raw.amount || 500,
        isBooked,
        status: isBooked ? 'booked' : 'available',
        activeBookingsCount: activeBookings.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCaregivers,
  getCaregiverById,
};
