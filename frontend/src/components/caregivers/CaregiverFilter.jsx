import React from 'react';
import { Search, MapPin, Star, X, Users, Stethoscope, Activity, HeartHandshake } from 'lucide-react';

export default function CaregiverFilter({
  selectedSpecialization,
  onSpecializationChange,
  locationQuery,
  onLocationChange,
  minRating,
  onRatingChange,
  onClear,
}) {
  const SPECIALIZATIONS = [
    { id: 'all', label: 'All Roles', icon: Users },
    { id: 'nurse', label: 'Registered Nurses', icon: Stethoscope },
    { id: 'physiotherapist', label: 'Physiotherapists', icon: Activity },
    { id: 'attendant', label: 'Care Attendants', icon: HeartHandshake },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      {/* Top Search and Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Locality Search */}
        <div className="relative md:col-span-2">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="Search by city locality (e.g. South Delhi, Saket, Green Park)..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-slate-900"
          />
          {locationQuery && (
            <button
              onClick={() => onLocationChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Rating Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative w-full">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={minRating}
              onChange={(e) => onRatingChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white text-slate-900 font-medium"
            >
              <option value="">Any Rating</option>
              <option value="4.5">★ 4.5 & Above</option>
              <option value="4.8">★ 4.8 & Above</option>
            </select>
          </div>

          {(selectedSpecialization !== 'all' || locationQuery || minRating) && (
            <button
              onClick={onClear}
              className="btn-outline text-xs px-3 py-2.5 text-slate-600 hover:text-slate-900 shrink-0 cursor-pointer"
              title="Reset Filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Specialization Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {SPECIALIZATIONS.map((spec) => {
          const Icon = spec.icon;
          const isSelected = selectedSpecialization === spec.id;
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => onSpecializationChange(spec.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{spec.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
