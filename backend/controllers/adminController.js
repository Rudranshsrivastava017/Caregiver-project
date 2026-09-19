const { UserModelAdapter, User } = require('../models/User');
const { CaregiverModelAdapter } = require('../models/Caregiver');

// 1. Get List of Caregivers Pending Admin Verification
const getPendingCaregivers = async (req, res, next) => {
  try {
    let pendingCaregivers = [];

    if (User.find && typeof User.find === 'function') {
      const users = await User.find({
        role: 'caregiver',
        verificationStatus: 'pending',
      });

      for (const u of users) {
        const cg = await CaregiverModelAdapter.findByUserId(u.userId);
        pendingCaregivers.push({
          user: typeof u.toSafeObject === 'function' ? u.toSafeObject() : u,
          caregiverProfile: cg || null,
        });
      }
    } else {
      // In-memory lookup
      const allUsers = Array.from((await UserModelAdapter.find?.()) || []);
      for (const u of allUsers) {
        if (u.role === 'caregiver' && u.verificationStatus === 'pending') {
          const cg = await CaregiverModelAdapter.findByUserId(u.userId);
          pendingCaregivers.push({
            user: typeof u.toSafeObject === 'function' ? u.toSafeObject() : u,
            caregiverProfile: cg || null,
          });
        }
      }
    }

    // Fallback demo pending caregivers if empty
    if (pendingCaregivers.length === 0) {
      const pendingUser = await UserModelAdapter.findByEmail('pending.caregiver@careelderly.org');
      if (pendingUser) {
        const cg = await CaregiverModelAdapter.findByUserId(pendingUser.userId);
        pendingCaregivers.push({
          user: typeof pendingUser.toSafeObject === 'function' ? pendingUser.toSafeObject() : pendingUser,
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
      // Try finding by email or caregiver profile
      const cg = await CaregiverModelAdapter.findById(id);
      if (cg) {
        user = await UserModelAdapter.findById(cg.linkedUserId);
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

module.exports = {
  getPendingCaregivers,
  verifyCaregiver,
};
