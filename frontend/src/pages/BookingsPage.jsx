import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/status/StatusBadge';
import {
  Calendar,
  User,
  Stethoscope,
  CheckCircle2,
  RefreshCw,
  Clock,
  Plus,
  ArrowRight,
  AlertCircle,
  Loader2,
  XCircle,
  Award,
  Filter,
} from 'lucide-react';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState(null); // bookingId being updated

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/bookings');
      if (response.data?.status === 'success') {
        setBookings(response.data.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load service bookings.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusTransition = async (bookingId, newStatus) => {
    setIsUpdating(bookingId);
    try {
      const response = await axiosClient.patch(`/bookings/${bookingId}/status`, {
        status: newStatus,
      });

      if (response.data?.status === 'success') {
        toast.success(`Booking status updated to ${newStatus}.`);
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingId === bookingId ? response.data.data : b
          )
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to update booking status.'
      );
    } finally {
      setIsUpdating(null);
    }
  };

  const isCaregiverRole = user?.role === 'caregiver';
  const isFamilyUser = user?.role === 'user';

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  const STATUS_TABS = [
    { id: 'all', label: 'All Bookings' },
    { id: 'pending', label: 'Pending Requests' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {isCaregiverRole ? 'Care Shifts & Booking Requests' : 'Service Bookings & Status Tracker'}
          </h1>
          <p className="text-slate-600 text-lg mt-1">
            {isCaregiverRole
              ? 'Review incoming requests from families, accept shifts, and track care sessions.'
              : 'Monitor active and upcoming care shifts, track caregiver status, and view session notes.'}
          </p>
        </div>

        {isFamilyUser && (
          <Link
            to="/booking/new"
            className="btn-primary flex items-center gap-2 px-5 py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Schedule New Shift</span>
          </Link>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <Filter className="w-4 h-4 text-slate-400 ml-2 mr-1 hidden sm:inline" />
        {STATUS_TABS.map((tab) => {
          const isSelected = statusFilter === tab.id;
          const count =
            tab.id === 'all'
              ? bookings.length
              : bookings.filter((b) => b.status === tab.id).length;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-teal-900 text-teal-100' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="space-y-2">
                  <div className="w-48 h-6 bg-slate-200 rounded" />
                  <div className="w-24 h-4 bg-slate-100 rounded" />
                </div>
                <div className="w-24 h-6 bg-slate-200 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-16 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error View */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-base font-bold text-red-900">
            Could not load bookings
          </h3>
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchBookings}
            className="btn-outline text-xs px-4 py-2 text-red-700 hover:bg-red-100 cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && bookings.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">
              {isCaregiverRole ? 'No Care Shifts Assigned Yet' : 'No Bookings Scheduled Yet'}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {isCaregiverRole
                ? 'Incoming booking requests from families will appear here once submitted.'
                : 'You have not booked any healthcare or nursing shifts yet. Schedule your first shift in minutes.'}
            </p>
          </div>
          {isFamilyUser && (
            <Link
              to="/booking/new"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Schedule Your First Shift</span>
            </Link>
          )}
        </div>
      )}

      {/* Empty Filter Results */}
      {!isLoading && !error && bookings.length > 0 && filteredBookings.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <p className="text-slate-700 font-semibold text-base">
            No bookings found in the "{statusFilter}" category.
          </p>
          <button
            onClick={() => setStatusFilter('all')}
            className="btn-outline text-xs px-4 py-2 cursor-pointer mt-2"
          >
            Show All Bookings
          </button>
        </div>
      )}

      {/* Bookings List Cards */}
      {!isLoading && !error && filteredBookings.length > 0 && (
        <div className="space-y-6">
          {filteredBookings.map((bk) => {
            const isProcessing = isUpdating === bk.bookingId;

            return (
              <div
                key={bk.bookingId}
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all space-y-5"
              >
                {/* Header: Service Name, Status Badge, Booking ID */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl font-bold text-slate-900">
                        {bk.serviceName}
                      </h2>
                      <StatusBadge status={bk.status} />
                    </div>
                    <span className="text-xs text-slate-500 font-mono mt-1 block">
                      Booking ID: {bk.bookingId}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-500 block">
                      Estimated Cost (Display Only)
                    </span>
                    <span className="text-xl font-black text-slate-900">
                      ₹{bk.totalPrice}
                    </span>
                  </div>
                </div>

                {/* 3-Column Info Box */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                      Patient
                    </span>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{bk.patientName}</span>
                    </p>
                    <p className="text-xs text-slate-600 truncate">{bk.patientAddress}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                      Caregiver
                    </span>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{bk.caregiverName}</span>
                    </p>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                      Verified Staff
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                      Scheduled Shift
                    </span>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{bk.scheduledDate}</span>
                    </p>
                    <p className="text-xs text-teal-800 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{bk.scheduledTime}</span>
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <Link
                    to={`/bookings/${bk.bookingId}`}
                    className="btn-outline text-xs px-4 py-2 text-slate-700 flex items-center gap-1 hover:text-slate-900"
                  >
                    <span>View Full Details & Notes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {/* Status Change Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Caregiver Actions */}
                    {isCaregiverRole && bk.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleStatusTransition(bk.bookingId, 'cancelled')}
                          className="btn-outline text-xs px-3.5 py-2 text-red-700 hover:bg-red-50 hover:border-red-300 cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleStatusTransition(bk.bookingId, 'confirmed')}
                          className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Request</span>
                        </button>
                      </>
                    )}

                    {isCaregiverRole && bk.status === 'confirmed' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleStatusTransition(bk.bookingId, 'in_progress')}
                        className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Start Shift</span>
                      </button>
                    )}

                    {isCaregiverRole && bk.status === 'in_progress' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleStatusTransition(bk.bookingId, 'completed')}
                        className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Award className="w-4 h-4" />
                        <span>Complete Shift</span>
                      </button>
                    )}

                    {/* Family User Actions */}
                    {isFamilyUser && ['pending', 'confirmed'].includes(bk.status) && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to cancel booking ${bk.bookingId}?`
                            )
                          ) {
                            handleStatusTransition(bk.bookingId, 'cancelled');
                          }
                        }}
                        className="btn-outline text-xs px-3.5 py-2 text-red-700 hover:bg-red-50 hover:border-red-300 cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
