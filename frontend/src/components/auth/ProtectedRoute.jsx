import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-teal-700 animate-spin" />
        <span className="text-slate-600 font-semibold text-sm">Verifying Authentication & Security Credentials...</span>
      </div>
    );
  }

  // 1. JWT Authentication Check
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Caregiver Legal ID Verification Guard (Section 5 of Spec)
  // Caregivers cannot access protected caregiver views if status is not approved
  if (user?.role === 'caregiver' && user?.verificationStatus === 'pending') {
    // Allow access to the verification pending page itself
    if (location.pathname !== '/caregiver/verification-pending') {
      return <Navigate to="/caregiver/verification-pending" replace />;
    }
  }

  // 3. Role-Based Access Control (RBAC)
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
