/**
 * Role-Based Access Control (RBAC) and Caregiver Verification Middlewares
 */

const roleGuard = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required to access this resource.',
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
    }

    next();
  };
};

const verificationGuard = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'fail',
      message: 'Authentication required.',
    });
  }

  // If caregiver, ensure verificationStatus is approved
  if (req.user.role === 'caregiver' && req.user.verificationStatus !== 'approved') {
    return res.status(403).json({
      status: 'fail',
      code: 'VERIFICATION_PENDING',
      message: 'Caregiver account verification is pending admin review. You cannot access care shifts yet.',
    });
  }

  next();
};

module.exports = {
  roleGuard,
  verificationGuard,
};
