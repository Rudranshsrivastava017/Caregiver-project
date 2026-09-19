import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/status/StatusBadge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  ShieldCheck,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Award,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchBooking = async () => {
    setIsLoading(true);
    try {
      const response = await axiosClient.get(`/bookings/${id}`);
      if (response.data?.status === 'success') {
        setBooking(response.data.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load booking details.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const response = await axiosClient.patch(`/bookings/${id}/status`, {
        status: newStatus,
      });

      if (response.data?.status === 'success') {
        toast.success(`Booking status updated to ${newStatus}.`);
        setBooking(response.data.data);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to update booking status.'
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-teal-700 animate-spin" />
        <p className="text-slate-600 font-semibold text-sm">
          Loading booking details...
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Booking Not Found</h2>
        <p className="text-slate-600 text-sm">
          {error || 'This booking record does not exist or you do not have permission to view it.'}
        </p>
        <Link to="/bookings" className="btn-primary inline-block">
          Return to Bookings
        </Link>
      </div>
    );
  }

  const isCaregiverRole = user?.role === 'caregiver';
  const isFamilyUser = user?.role === 'user';

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Back link */}
      <Link
        to="/bookings"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Bookings Tracker</span>
      </Link>

      {/* Main Booking Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
        {/* Header with Booking ID & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs text-slate-500 font-mono block">
              Booking ID: {booking.bookingId}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {booking.serviceName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={booking.status} className="text-sm px-4 py-1.5" />
          </div>
        </div>

        {/* Shift Schedule Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-teal-50/60 p-5 rounded-2xl border border-teal-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Scheduled Date
            </span>
            <p className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-700" />
              {booking.scheduledDate}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Shift Time Slot
            </span>
            <p className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-700" />
              {booking.scheduledTime}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Estimated Rate
            </span>
            <p className="font-black text-slate-900 text-xl">
              ₹{booking.totalPrice}
            </p>
          </div>
        </div>

        {/* Patient & Caregiver Profiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Patient Details */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-sm uppercase tracking-wider">
              <User className="w-4 h-4" />
              <span>Elderly Patient Profile</span>
            </div>

            <div className="flex items-start gap-4">
              <img
                src={
                  booking.patientPhoto ||
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
                }
                alt={booking.patientName}
                className="w-14 h-14 rounded-full object-cover border-2 border-teal-600 shrink-0"
              />
              <div className="space-y-1 text-xs">
                <p className="text-base font-bold text-slate-900">
                  {booking.patientName}
                </p>
                {booking.patientAge && (
                  <p className="text-slate-600">
                    {booking.patientAge} yrs • Mobility:{' '}
                    <strong className="capitalize text-teal-800">
                      {booking.patientMobility}
                    </strong>
                  </p>
                )}
                <p className="text-slate-700 flex items-start gap-1 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{booking.patientAddress}</span>
                </p>
                {booking.patientEmergencyContact && (
                  <p className="text-slate-700 flex items-center gap-1 pt-1">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      Emergency: {booking.patientEmergencyContact} (
                      {booking.patientEmergencyPhone})
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Caregiver Details */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-sm uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Assigned Healthcare Staff</span>
            </div>

            <div className="flex items-start gap-4">
              <img
                src={
                  booking.caregiverPhoto ||
                  'https://images.unsplash.com/photo-1594824813566-88855ce7890b?auto=format&fit=crop&w=150&q=80'
                }
                alt={booking.caregiverName}
                className="w-14 h-14 rounded-full object-cover border-2 border-teal-600 shrink-0"
              />
              <div className="space-y-1 text-xs">
                <p className="text-base font-bold text-slate-900">
                  {booking.caregiverName}
                </p>
                <p className="text-teal-800 font-semibold">
                  {booking.caregiverQualification}
                </p>
                <span className="text-amber-800 font-bold block">
                  ★ {booking.caregiverRating || 5.0} rating
                </span>
                <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                  Verified Legal ID & License
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Informational Disclaimer */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <p>
            <strong>Display Estimate Only:</strong> Online payment is excluded. This service shift is billed directly according to platform care policy upon shift completion.
          </p>
        </div>

        {/* Status Actions & Controls */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Created on: {new Date(booking.createdAt || Date.now()).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-3">
            {/* Caregiver Actions */}
            {isCaregiverRole && booking.status === 'pending' && (
              <>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange('cancelled')}
                  className="btn-outline text-xs px-4 py-2.5 text-red-700 hover:bg-red-50 hover:border-red-300 cursor-pointer"
                >
                  Decline Request
                </button>

                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange('confirmed')}
                  className="btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Shift</span>
                </button>
              </>
            )}

            {isCaregiverRole && booking.status === 'confirmed' && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('in_progress')}
                className="btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Start Shift (Mark In Progress)</span>
              </button>
            )}

            {isCaregiverRole && booking.status === 'in_progress' && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange('completed')}
                className="btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700"
              >
                <Award className="w-4 h-4" />
                <span>Complete Care Shift</span>
              </button>
            )}

            {/* Family User Actions: Cancel Request */}
            {isFamilyUser &&
              ['pending', 'confirmed'].includes(booking.status) && (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => {
                    if (
                      window.confirm(
                        'Are you sure you want to cancel this scheduled care shift?'
                      )
                    ) {
                      handleStatusChange('cancelled');
                    }
                  }}
                  className="btn-outline text-xs px-4 py-2.5 text-red-700 hover:bg-red-50 hover:border-red-300 cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel Booking</span>
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
