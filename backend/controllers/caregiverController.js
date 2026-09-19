const { CaregiverModelAdapter } = require('../models/Caregiver');

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

    return res.status(200).json({
      status: 'success',
      count: caregivers.length,
      data: caregivers,
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

    return res.status(200).json({
      status: 'success',
      data: caregiver,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCaregivers,
  getCaregiverById,
};
