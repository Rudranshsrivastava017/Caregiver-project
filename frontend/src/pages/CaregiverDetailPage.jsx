import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  Award,
  AlertCircle,
  Loader2,
  PhoneCall,
} from 'lucide-react';

export default function CaregiverDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caregiver, setCaregiver] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCaregiver = async () => {
      setIsLoading(true);
      try {
        const response = await axiosClient.get(`/caregivers/${id}`);
        if (response.data?.status === 'success' && isMounted) {
          setCaregiver(response.data.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || 'Caregiver profile not found.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCaregiver();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-teal-700 animate-spin" />
        <p className="text-slate-600 font-semibold text-sm">
          Loading caregiver profile...
        </p>
      </div>
    );
  }

  if (error || !caregiver) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">
          Caregiver Profile Not Found
        </h2>
        <p className="text-slate-600 text-sm">
          The caregiver profile you are seeking is either unavailable or pending verification.
        </p>
        <Link to="/caregivers" className="btn-primary inline-block">
          Browse Verified Caregivers
        </Link>
      </div>
    );
  }

  const defaultPhoto =
    'https://images.unsplash.com/photo-1594824813566-88855ce7890b?auto=format&fit=crop&w=300&q=80';

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Back Button */}
      <Link
        to="/caregivers"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Caregiver Directory</span>
      </Link>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b border-slate-100 pb-6">
          <img
            src={caregiver.photoUrl || defaultPhoto}
            alt={caregiver.fullName}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-teal-600 shadow-sm shrink-0"
            onError={(e) => {
              e.target.src = defaultPhoto;
            }}
          />

          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {caregiver.fullName}
              </h1>
              {caregiver.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Government ID Verified</span>
                </span>
              )}
              {caregiver.isBooked ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                  <span>Booked (Shift Scheduled)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>Available for Booking</span>
                </span>
              )}
            </div>

            <p className="text-base font-bold text-teal-800">
              {caregiver.qualification}
            </p>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-600 flex-wrap">
              <span className="bg-teal-50 font-extrabold px-3 py-1 rounded-lg text-teal-900 border border-teal-200">
                ₹{caregiver.amount || caregiver.rate || 500} / shift
              </span>
              <span>•</span>
              <span className="bg-slate-100 font-semibold px-2.5 py-1 rounded-lg text-slate-800 uppercase tracking-wide">
                Role: {caregiver.specialization}
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-800">
                {caregiver.yearsExperience}+ Years Clinical Experience
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{caregiver.rating || 5.0}</span>
                <span className="font-normal text-slate-500">
                  ({caregiver.reviewsCount || 0} reviews)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">Professional Bio</h2>
          <p className="text-slate-700 text-base leading-relaxed">
            {caregiver.bio || 'Dedicated healthcare worker providing continuous compassionate bedside nursing, physiotherapy, or attendant assistance for senior citizens.'}
          </p>
        </div>

        {/* Localities & Coverage Areas */}
        <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span>Service Coverage Areas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(caregiver.serviceAreas) ? (
              caregiver.serviceAreas.map((area, idx) => (
                <span
                  key={idx}
                  className="bg-white text-slate-800 font-semibold text-xs px-3 py-1 rounded-lg border border-slate-300"
                >
                  {area}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-700">
                {caregiver.serviceAreas}
              </span>
            )}
          </div>
        </div>

        {/* Weekly Availability Schedule */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Clock className="w-5 h-5 text-teal-600" />
            <span>Standard Weekly Availability</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.isArray(caregiver.availability) && caregiver.availability.length > 0 ? (
              caregiver.availability.map((slot, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1"
                >
                  <span className="font-bold text-slate-900 text-sm block">
                    {slot.day}
                  </span>
                  <span className="text-xs text-teal-800 font-mono font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-100 inline-block">
                    {slot.startTime} – {slot.endTime}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">
                Flexible full-week scheduling available on request.
              </p>
            )}
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a
            href="tel:18001234567"
            className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 hover:text-teal-700"
          >
            <PhoneCall className="w-4 h-4 text-teal-600" />
            <span>Questions? Call CareElderly Helpline: 1800-123-4567</span>
          </a>

          <Link
            to={`/booking/new?caregiverId=${caregiver.caregiverId}`}
            className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Calendar className="w-5 h-5" />
            <span>Book Shifts with {caregiver.fullName.split(' ')[0]}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
