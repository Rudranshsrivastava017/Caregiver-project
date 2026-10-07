import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../api/axiosClient';
import ScheduleCalendar from '../components/booking/ScheduleCalendar';
import BookingSummary from '../components/booking/BookingSummary';
import {
  Calendar,
  User,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Plus,
  Star,
  Lock,
} from 'lucide-react';

export default function NewBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Wizard Steps: 1: Patient & Service, 2: Caregiver & Schedule, 3: Review Summary
  const [currentStep, setCurrentStep] = useState(1);

  // Data collections
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Selected Booking Attributes
  const [selectedPatientId, setSelectedPatientId] = useState(
    searchParams.get('patientId') || ''
  );
  const [selectedServiceId, setSelectedServiceId] = useState(
    searchParams.get('serviceId') || ''
  );
  const [selectedCaregiverId, setSelectedCaregiverId] = useState(
    searchParams.get('caregiverId') || ''
  );

  // Tomorrow as default date in YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [scheduledDate, setScheduledDate] = useState(tomorrowStr);
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('4 Hours');

  // Conflict error state (from backend 409 response)
  const [conflictError, setConflictError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial data on mount
  useEffect(() => {
    let isMounted = true;
    const loadBookingResources = async () => {
      setIsLoadingData(true);
      try {
        const [patientsRes, servicesRes, caregiversRes] = await Promise.all([
          axiosClient.get('/patients'),
          axiosClient.get('/services'),
          axiosClient.get('/caregivers'),
        ]);

        if (isMounted) {
          setPatients(patientsRes.data?.data || []);
          setServices(servicesRes.data?.data || []);
          setCaregivers(caregiversRes.data?.data || []);

          // Auto-select first patient if only 1 exists and none selected
          if (!selectedPatientId && patientsRes.data?.data?.length === 1) {
            setSelectedPatientId(
              patientsRes.data.data[0].patientId || patientsRes.data.data[0]._id
            );
          }
        }
      } catch (err) {
        toast.error('Failed to load booking resources. Please refresh.');
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    loadBookingResources();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPatient = patients.find(
    (p) => (p.patientId || p._id) === selectedPatientId
  );
  const selectedService = services.find(
    (s) => (s.serviceId || s._id) === selectedServiceId
  );
  const selectedCaregiver = caregivers.find(
    (c) => (c.caregiverId || c._id) === selectedCaregiverId
  );

  // Step 1 Validation & Next
  const handleProceedToStep2 = () => {
    if (!selectedPatientId) {
      toast.error('Please select an elderly family member for care.');
      return;
    }
    if (!selectedServiceId) {
      toast.error('Please select a healthcare service.');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 Validation & Next
  const handleProceedToStep3 = () => {
    if (!selectedCaregiverId) {
      toast.error('Please select a verified healthcare caregiver.');
      return;
    }
    if (!scheduledDate) {
      toast.error('Please select a shift date.');
      return;
    }
    if (!scheduledTime) {
      toast.error('Please select a shift time slot.');
      return;
    }
    setConflictError(null);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Final Submit to Backend
  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    setConflictError(null);
    try {
      const payload = {
        patientId: selectedPatientId,
        caregiverId: selectedCaregiverId,
        serviceId: selectedServiceId,
        scheduledDate,
        scheduledTime,
        duration,
      };

      const response = await axiosClient.post('/bookings', payload);

      if (response.data?.status === 'success') {
        toast.success(
          'Care shift booking request sent successfully! Caregiver notified.'
        );
        navigate('/bookings');
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // Double-booking conflict caught!
        const msg =
          err.response?.data?.message ||
          'Time slot conflict detected. This caregiver is already booked.';
        setConflictError(msg);
        toast.error(msg);
        // Send back to Step 2 so user can select another time slot
        setCurrentStep(2);
      } else {
        const errorMsg =
          err.response?.data?.message || 'Failed to submit booking request.';
        toast.error(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-teal-700 animate-spin" />
        <p className="text-slate-600 font-semibold text-sm">
          Loading booking resources & verified staff...
        </p>
      </div>
    );
  }

  // Guard: If user has no patients registered, guide them to create one
  if (patients.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          No Elderly Profiles Registered
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Before booking home care or nursing, you must register at least one elderly family member profile with their medical history and care address.
        </p>
        <Link
          to="/patients/new"
          className="btn-primary inline-flex items-center gap-2 px-6 py-3"
        >
          <Plus className="w-5 h-5" />
          <span>Register Patient Profile</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header & Step Wizard Indicator */}
      <div className="border-b border-slate-200 pb-6 space-y-4">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Schedule Home Care Shift
        </h1>
        <p className="text-slate-600 text-base">
          Book trusted nursing and attendant support in 3 simple steps.
        </p>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              currentStep === 1
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : currentStep > 1
                ? 'bg-teal-50 text-teal-900 border-teal-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            <span>1. Patient & Service</span>
          </div>

          <div
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              currentStep === 2
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : currentStep > 2
                ? 'bg-teal-50 text-teal-900 border-teal-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            <span>2. Caregiver & Schedule</span>
          </div>

          <div
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              currentStep === 3
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            <span>3. Review & Confirm</span>
          </div>
        </div>
      </div>

      {/* Conflict Error Alert (if double-booking attempted) */}
      {conflictError && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 text-red-900 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <strong className="block font-bold">Time Slot Conflict Detected:</strong>
            <p>{conflictError}</p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 1: Select Patient & Select Service */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 1 && (
        <div className="space-y-8">
          {/* Patient Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                <User className="w-5 h-5 text-teal-600" />
                <span>Select Elderly Family Member</span>
              </div>
              <Link
                to="/patients/new"
                className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Patient</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {patients.map((p) => {
                const id = p.patientId || p._id;
                const isSelected = selectedPatientId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedPatientId(id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/60 shadow-xs ring-1 ring-teal-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <img
                      src={
                        p.photoUrl ||
                        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={p.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-teal-600 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {p.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {p.age} yrs • Mobility: {p.mobilityStatus}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <span>Select Healthcare Service</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((s) => {
                const id = s.serviceId || s._id;
                const isSelected = selectedServiceId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedServiceId(id)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/60 shadow-xs ring-1 ring-teal-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md uppercase">
                        {s.category?.replace('_', ' ')}
                      </span>
                      <span className="font-extrabold text-slate-900 text-base">
                        ₹{s.price}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {s.serviceName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {s.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-xs font-bold text-teal-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Selected Service</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleProceedToStep2}
              className="btn-primary px-8 py-3.5 text-base flex items-center gap-2 shadow-md cursor-pointer"
            >
              <span>Continue to Caregiver & Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: Select Caregiver & Schedule Time Slot */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 2 && (
        <div className="space-y-8">
          {/* Caregiver Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <span>Select Verified Caregiver</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {caregivers.map((cg) => {
                const id = cg.caregiverId || cg._id;
                const isSelected = selectedCaregiverId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSelectedCaregiverId(id);
                      setScheduledTime(''); // reset time when caregiver changes
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/60 shadow-xs ring-1 ring-teal-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          cg.photoUrl ||
                          'https://images.unsplash.com/photo-1594824813566-88855ce7890b?auto=format&fit=crop&w=150&q=80'
                        }
                        alt={cg.fullName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-teal-600 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-sm truncate">
                          {cg.fullName}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-teal-800 uppercase block">
                            {cg.specialization}
                          </span>
                          {cg.isBooked && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                              Booked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">₹{cg.amount || cg.rate || 500}</span>
                        <span className="font-bold text-amber-800 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          {cg.rating || 5.0} rating
                        </span>
                      </div>
                      <p className="truncate">{cg.qualification}</p>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1 text-xs font-bold text-teal-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Selected</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule Calendar & Slot Conflict Check */}
          {selectedCaregiver && (
            <ScheduleCalendar
              caregiver={selectedCaregiver}
              selectedDate={scheduledDate}
              onDateChange={setScheduledDate}
              selectedTime={scheduledTime}
              onTimeChange={setScheduledTime}
              duration={duration}
              onDurationChange={setDuration}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="btn-outline px-5 py-3 text-sm flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToStep3}
              className="btn-primary px-8 py-3.5 text-base flex items-center gap-2 shadow-md cursor-pointer"
            >
              <span>Review Booking Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 3: Review Booking Summary & Final Confirmation */}
      {/* ------------------------------------------------------------- */}
      {currentStep === 3 && (
        <BookingSummary
          patient={selectedPatient}
          caregiver={selectedCaregiver}
          service={selectedService}
          scheduledDate={scheduledDate}
          scheduledTime={scheduledTime}
          duration={duration}
          onConfirm={handleConfirmBooking}
          onBack={() => setCurrentStep(2)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
