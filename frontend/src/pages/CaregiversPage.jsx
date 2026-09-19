import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import CaregiverCard from '../components/caregivers/CaregiverCard';
import CaregiverFilter from '../components/caregivers/CaregiverFilter';
import { ShieldCheck, Loader2, AlertCircle, Users } from 'lucide-react';

export default function CaregiversPage() {
  const [caregivers, setCaregivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [locationQuery, setLocationQuery] = useState('');
  const [minRating, setMinRating] = useState('');

  const fetchCaregivers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedSpecialization && selectedSpecialization !== 'all') {
        params.specialization = selectedSpecialization;
      }
      if (locationQuery && locationQuery.trim() !== '') {
        params.location = locationQuery.trim();
      }
      if (minRating) {
        params.minRating = minRating;
      }

      const response = await axiosClient.get('/caregivers', { params });
      if (response.data?.status === 'success') {
        setCaregivers(response.data.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load caregivers directory.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCaregivers();
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [selectedSpecialization, locationQuery, minRating]);

  const handleClearFilters = () => {
    setSelectedSpecialization('all');
    setLocationQuery('');
    setMinRating('');
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>100% Identity & License Verified Directory</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Verified Healthcare Professionals
        </h1>
        <p className="text-slate-600 text-lg mt-2">
          Browse verified nurses, certified physiotherapists, and attendants available for scheduled home shifts.
        </p>
      </div>

      {/* Filter Component */}
      <CaregiverFilter
        selectedSpecialization={selectedSpecialization}
        onSpecializationChange={setSelectedSpecialization}
        locationQuery={locationQuery}
        onLocationChange={setLocationQuery}
        minRating={minRating}
        onRatingChange={setMinRating}
        onClear={handleClearFilters}
      />

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-12 bg-slate-100 rounded" />
              <div className="h-14 bg-slate-100 rounded-xl" />
              <div className="flex justify-between pt-4 border-t border-slate-100">
                <div className="w-20 h-7 bg-slate-200 rounded" />
                <div className="w-24 h-7 bg-slate-200 rounded" />
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
            Could not fetch caregivers
          </h3>
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchCaregivers}
            className="btn-outline text-xs px-4 py-2 text-red-700 hover:bg-red-100 cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && caregivers.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            No Caregivers Found
          </h3>
          <p className="text-slate-600 text-sm">
            No healthcare professionals matched your specific role or locality criteria. Try broadening your location or resetting filters.
          </p>
          <button
            onClick={handleClearFilters}
            className="btn-primary inline-block px-5 py-2.5 text-sm cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Caregivers Grid */}
      {!isLoading && !error && caregivers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {caregivers.map((caregiver) => (
            <CaregiverCard
              key={caregiver.caregiverId || caregiver._id}
              caregiver={caregiver}
            />
          ))}
        </div>
      )}
    </div>
  );
}
