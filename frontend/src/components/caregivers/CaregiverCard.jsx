import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Star,
  MapPin,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
} from 'lucide-react';

export default function CaregiverCard({ caregiver }) {
  const defaultPhoto =
    'https://images.unsplash.com/photo-1594824813566-88855ce7890b?auto=format&fit=crop&w=300&q=80';

  const getSpecializationBadge = (spec) => {
    switch (spec) {
      case 'nurse':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'physiotherapist':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'attendant':
      default:
        return 'bg-purple-50 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 hover:border-teal-500">
      <div className="space-y-4">
        {/* Top Header: Photo, Name, Verified Badge, Specialization */}
        <div className="flex items-start gap-4">
          <img
            src={caregiver.photoUrl || defaultPhoto}
            alt={caregiver.fullName}
            className="w-16 h-16 rounded-full object-cover border-2 border-teal-600 shadow-xs shrink-0"
            onError={(e) => {
              e.target.src = defaultPhoto;
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-bold text-slate-900 text-lg leading-tight truncate">
                {caregiver.fullName}
              </h2>
              {caregiver.verified && (
                <span title="Government Legal ID & Clinical License Verified">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getSpecializationBadge(
                  caregiver.specialization
                )}`}
              >
                {caregiver.specialization}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {caregiver.yearsExperience}+ Yrs Exp
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-700 mt-1 truncate">
              {caregiver.qualification}
            </p>
          </div>
        </div>

        {/* Bio */}
        <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
          {caregiver.bio || 'Dedicated healthcare professional experienced in senior home health and nursing care.'}
        </p>

        {/* Rating & Service Areas */}
        <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-semibold">Rating:</span>
            <span className="text-amber-800 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{caregiver.rating || 5.0}</span>
              <span className="text-slate-500 font-normal">
                ({caregiver.reviewsCount || 0} reviews)
              </span>
            </span>
          </div>

          <div className="flex items-start justify-between gap-2 border-t border-slate-200 pt-2">
            <span className="text-slate-600 font-semibold flex items-center gap-1 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>Localities:</span>
            </span>
            <span className="text-slate-800 font-medium text-right line-clamp-1">
              {Array.isArray(caregiver.serviceAreas)
                ? caregiver.serviceAreas.slice(0, 3).join(', ')
                : caregiver.serviceAreas}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Verified Stamp & Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span className="hidden sm:inline">Verified ID</span>
        </span>

        <div className="flex items-center gap-2">
          <Link
            to={`/caregivers/${caregiver.caregiverId}`}
            className="btn-outline text-xs px-3 py-2 text-slate-700 hover:text-slate-900"
          >
            Profile
          </Link>

          <Link
            to={`/booking/new?caregiverId=${caregiver.caregiverId}`}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1"
          >
            <span>Select</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
