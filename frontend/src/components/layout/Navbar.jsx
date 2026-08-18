import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, PhoneCall, ShieldCheck, UserCheck, Calendar, Stethoscope, Users, LogOut, Clock, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path ? 'text-teal-800 font-bold border-b-2 border-teal-700' : 'text-slate-700 hover:text-teal-700';
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Banner - Emergency Assistance & Trust Signals */}
      <div className="bg-slate-900 text-white text-sm py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Identity & Certification Verified Healthcare Professionals</span>
          </div>
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <a href="tel:18001234567" className="flex items-center gap-1.5 font-bold text-teal-300 hover:underline">
              <PhoneCall className="w-4 h-4 text-amber-400" />
              <span>24/7 Helpline: 1800-123-4567</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-md group-hover:bg-teal-800 transition-colors">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight block leading-none">
              Care<span className="text-teal-700">Elderly</span>
            </span>
            <span className="text-xs text-slate-500 font-semibold tracking-wide">
              Healthcare & Nursing Portal
            </span>
          </div>
        </Link>

        {/* Dynamic Navigation Links based on RBAC */}
        <div className="hidden md:flex items-center gap-8 text-base font-semibold">
          <Link to="/" className={`py-1 flex items-center gap-1.5 ${isActive('/')}`}>
            Home
          </Link>
          <Link to="/services" className={`py-1 flex items-center gap-1.5 ${isActive('/services')}`}>
            <Stethoscope className="w-4 h-4 text-teal-600" />
            Services
          </Link>
          <Link to="/caregivers" className={`py-1 flex items-center gap-1.5 ${isActive('/caregivers')}`}>
            <UserCheck className="w-4 h-4 text-teal-600" />
            Caregivers
          </Link>

          {/* Conditional Role-Based Links */}
          {isAuthenticated && user?.role === 'user' && (
            <>
              <Link to="/patients" className={`py-1 flex items-center gap-1.5 ${isActive('/patients')}`}>
                <Users className="w-4 h-4 text-teal-600" />
                Patients
              </Link>
              <Link to="/bookings" className={`py-1 flex items-center gap-1.5 ${isActive('/bookings')}`}>
                <Calendar className="w-4 h-4 text-teal-600" />
                Bookings
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === 'caregiver' && (
            <>
              <Link to="/bookings" className={`py-1 flex items-center gap-1.5 ${isActive('/bookings')}`}>
                <Calendar className="w-4 h-4 text-teal-600" />
                Care Shifts
              </Link>
              {user.verificationStatus === 'pending' && (
                <Link to="/caregiver/verification-pending" className={`py-1 flex items-center gap-1.5 text-amber-700 font-bold ${isActive('/caregiver/verification-pending')}`}>
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  ID Verification
                </Link>
              )}
            </>
          )}
        </div>

        {/* User Auth Action Buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-slate-100 p-1.5 pr-3 rounded-full border border-slate-200">
                <img
                  src={user.profilePhotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                  alt={user.fullName}
                  className="w-9 h-9 rounded-full object-cover border-2 border-teal-600"
                />
                <div className="hidden sm:block text-left text-xs">
                  <span className="font-bold text-slate-900 block leading-tight">{user.fullName}</span>
                  <span className="capitalize text-slate-500 font-medium flex items-center gap-1">
                    {user.role === 'caregiver' ? 'Nurse/Caregiver' : 'Family Member'}
                    {user.verificationStatus === 'pending' && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 rounded">Pending ID</span>
                    )}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="btn-outline text-xs sm:text-sm px-3.5 py-2 text-red-700 hover:bg-red-50 hover:border-red-300"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-outline px-4 py-2 text-sm sm:text-base">
                Log In
              </Link>
              <Link to="/register" className="btn-primary px-4 py-2 text-sm sm:text-base">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
