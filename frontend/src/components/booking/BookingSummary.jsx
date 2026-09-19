import React from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  MapPin,
  ShieldCheck,
  Info,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export default function BookingSummary({
  patient,
  caregiver,
  service,
  scheduledDate,
  scheduledTime,
  duration,
  onConfirm,
  onBack,
  isSubmitting = false,
}) {
  const totalPrice = service?.price || 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Booking Request Summary
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Please review the care shift details before confirming your booking request.
          </p>
        </div>

        {/* 1. Patient & Location */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-sm uppercase tracking-wider">
            <User className="w-4 h-4" />
            <span>Care Recipient (Patient)</span>
          </div>

          <div className="flex items-start gap-4">
            <img
              src={
                patient?.photoUrl ||
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
              }
              alt={patient?.fullName}
              className="w-14 h-14 rounded-full object-cover border-2 border-teal-600 shrink-0"
            />
            <div className="space-y-1 text-sm">
              <p className="text-base font-bold text-slate-900">
                {patient?.fullName} ({patient?.age} yrs, {patient?.gender})
              </p>
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{patient?.address}</span>
              </p>
              <p className="text-xs text-slate-600">
                Mobility:{' '}
                <strong className="capitalize text-teal-800">
                  {patient?.mobilityStatus}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* 2. Service & Caregiver Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Service */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-sm uppercase tracking-wider">
              <Stethoscope className="w-4 h-4" />
              <span>Healthcare Service</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {service?.serviceName}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-2">
              {service?.description}
            </p>
            <span className="inline-block text-[11px] font-bold bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded-full uppercase">
              {service?.category?.replace('_', ' ')}
            </span>
          </div>

          {/* Assigned Caregiver */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-sm uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Assigned Caregiver</span>
            </div>
            <div className="flex items-center gap-3">
              <img
                src={
                  caregiver?.photoUrl ||
                  'https://images.unsplash.com/photo-1594824813566-88855ce7890b?auto=format&fit=crop&w=150&q=80'
                }
                alt={caregiver?.fullName}
                className="w-12 h-12 rounded-full object-cover border-2 border-teal-600 shrink-0"
              />
              <div>
                <p className="text-base font-bold text-slate-900">
                  {caregiver?.fullName}
                </p>
                <p className="text-xs font-semibold text-teal-800">
                  {caregiver?.qualification}
                </p>
                <span className="text-[11px] text-slate-500">
                  ★ {caregiver?.rating || 5.0} rating
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Schedule & Shift Timing */}
        <div className="bg-teal-50/60 rounded-2xl p-5 border border-teal-200 space-y-3">
          <div className="flex items-center gap-2 text-teal-900 font-bold text-sm uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-teal-700" />
            <span>Scheduled Shift Time</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Date:</span>
              <span className="font-bold text-slate-900">{scheduledDate}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Time Slot:</span>
              <span className="font-bold text-slate-900">{scheduledTime}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Duration:</span>
              <span className="font-bold text-slate-900">{duration}</span>
            </div>
          </div>
        </div>

        {/* 4. Display Price Estimate & No-Payment Policy Disclaimer */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <span className="text-sm font-bold text-slate-700">
              Estimated Service Cost
            </span>
            <span className="text-2xl font-black text-slate-900">
              ₹{totalPrice}
            </span>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <p>
              <strong>Informational Estimate Only:</strong> In accordance with platform policy, online payment is excluded. Your booking will be sent directly to the assigned caregiver for confirmation without any checkout step.
            </p>
          </div>
        </div>

        {/* Navigation & Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="btn-outline px-5 py-3 text-sm flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="btn-primary px-8 py-3.5 text-base flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Booking...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm & Send Booking</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
