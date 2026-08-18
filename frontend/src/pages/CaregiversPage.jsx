import React from 'react';
import { MOCK_CAREGIVERS } from '../data/mockData';
import { ShieldCheck, Star, MapPin, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CaregiversPage() {
  return (
    <div className="space-y-8 py-4">
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" /> Government Legal ID Verified
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Verified Healthcare Professionals</h1>
        <p className="text-slate-600 text-lg mt-2">
          Browse verified nurses, physiotherapists, and attendants available for home shifts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_CAREGIVERS.map((cg) => (
          <div key={cg.caregiverId} className="card-senior flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img src={cg.photoUrl} alt={cg.fullName} className="w-16 h-16 rounded-full object-cover border-2 border-teal-600 shadow-sm" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-bold text-slate-900 text-lg">{cg.fullName}</h2>
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                  </div>
                  <span className="badge-verified">{cg.qualification}</span>
                  <p className="text-xs text-slate-500 mt-1">{cg.yearsExperience} Years Clinical Exp.</p>
                </div>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed">{cg.bio}</p>

              <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-xs border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Rating & Feedback:</span>
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    {cg.rating} ({cg.reviewsCount} reviews)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Service Localities:</span>
                  <span className="text-slate-800 font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    {cg.serviceAreas.slice(0, 2).join(', ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                ID & License Verified
              </span>
              <Link to="/booking/new" className="btn-primary text-xs px-4 py-2">
                Select Caregiver
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
