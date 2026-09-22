const { UserModelAdapter } = require('../models/User');
const { CaregiverModelAdapter } = require('../models/Caregiver');
const { PatientModelAdapter } = require('../models/Patient');
const { BookingModelAdapter } = require('../models/Booking');
const { ServiceModelAdapter } = require('../models/Service');

// 1. Get List of Caregivers Pending Admin Verification
const getPendingCaregivers = async (req, res, next) => {
  try {
    const allUsers = await UserModelAdapter.find();
    let pendingCaregivers = [];

    for (const u of allUsers) {
      if (u.role === 'caregiver' && u.verificationStatus === 'pending') {
        const cg = await CaregiverModelAdapter.findByUserId(u.userId);
        pendingCaregivers.push({
          user: typeof u.toSafeObject === 'function' ? u.toSafeObject() : u,
          caregiverProfile: cg || null,
        });
      }
    }

    return res.status(200).json({
      status: 'success',
      count: pendingCaregivers.length,
      data: pendingCaregivers,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Approve or Reject Caregiver Verification
const verifyCaregiver = async (req, res, next) => {
  try {
    const { id } = req.params; // userId or caregiverId
    const { decision, reason } = req.body; // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({
        status: 'fail',
        message: "Decision must be either 'approved' or 'rejected'.",
      });
    }

    let user = await UserModelAdapter.findById(id);
    if (!user) {
      // Try finding by caregiver profile id or email
      const cg = await CaregiverModelAdapter.findById(id);
      if (cg) {
        user = await UserModelAdapter.findById(cg.linkedUserId);
      } else {
        user = await UserModelAdapter.findByEmail(id);
      }
    }

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Caregiver user not found.',
      });
    }

    user.verificationStatus = decision;
    user.legalIdVerified = decision === 'approved';
    await UserModelAdapter.saveUser(user);

    // Update Caregiver profile table
    const caregiver = await CaregiverModelAdapter.findByUserId(user.userId);
    if (caregiver) {
      await CaregiverModelAdapter.updateCaregiver(caregiver.caregiverId, {
        verified: decision === 'approved',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Caregiver credentials have been ${decision}.`,
      data: {
        userId: user.userId,
        verificationStatus: user.verificationStatus,
        legalIdVerified: user.legalIdVerified,
        reason: reason || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Reject Caregiver (convenience handler)
const rejectCaregiver = async (req, res, next) => {
  req.body.decision = 'rejected';
  return verifyCaregiver(req, res, next);
};

// 4. Get Platform Analytics Overview
const getAdminAnalytics = async (req, res, next) => {
  try {
    const [users, caregivers, patients, bookings, services] = await Promise.all([
      UserModelAdapter.find(),
      CaregiverModelAdapter.find(),
      PatientModelAdapter.find(),
      BookingModelAdapter.find(),
      ServiceModelAdapter.find(),
    ]);

    const familyUsersCount = users.filter((u) => u.role === 'user').length;
    const caregiversCount = users.filter((u) => u.role === 'caregiver').length;
    const pendingCaregiversCount = users.filter(
      (u) => u.role === 'caregiver' && u.verificationStatus === 'pending'
    ).length;
    const verifiedCaregiversCount = caregivers.filter((cg) => cg.verified).length;

    const pendingBookingsCount = bookings.filter((b) => b.status === 'pending').length;
    const confirmedBookingsCount = bookings.filter((b) => b.status === 'confirmed').length;
    const inProgressBookingsCount = bookings.filter((b) => b.status === 'in_progress').length;
    const completedBookingsCount = bookings.filter((b) => b.status === 'completed').length;
    const cancelledBookingsCount = bookings.filter((b) => b.status === 'cancelled').length;
    const activeBookingsCount = confirmedBookingsCount + inProgressBookingsCount;

    return res.status(200).json({
      status: 'success',
      data: {
        users: {
          totalUsers: users.length,
          familyUsers: familyUsersCount,
          totalCaregivers: caregiversCount,
          verifiedCaregivers: verifiedCaregiversCount,
          pendingCaregivers: pendingCaregiversCount,
        },
        patients: {
          totalPatients: patients.length,
        },
        bookings: {
          totalBookings: bookings.length,
          activeBookings: activeBookingsCount,
          pending: pendingBookingsCount,
          confirmed: confirmedBookingsCount,
          inProgress: inProgressBookingsCount,
          completed: completedBookingsCount,
          cancelled: cancelledBookingsCount,
        },
        services: {
          totalServices: services.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingCaregivers,
  verifyCaregiver,
  rejectCaregiver,
  getAdminAnalytics,
};
