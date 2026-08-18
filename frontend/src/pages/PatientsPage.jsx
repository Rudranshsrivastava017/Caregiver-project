import React from 'react';
import { MOCK_PATIENTS } from '../data/mockData';
import { Plus, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientsPage() {
  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Elderly Patient Profiles</h1>
          <p className="text-slate-600 text-lg mt-1">
            Manage profiles for elderly family members receiving healthcare support.
          </p>
        </div>
        <Link to="/patients/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>Add Patient Profile</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_PATIENTS.map((pt) => (
          <div key={pt.patientId} className="card-senior space-y-4">
            <div className="flex items-start gap-4">
              <img src={pt.photoUrl} alt={pt.fullName} className="w-16 h-16 rounded-full object-cover border-2 border-teal-600 shadow-sm" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{pt.fullName}</h2>
                  <span className="text-xs bg-slate-100 font-semibold px-2 py-0.5 rounded text-slate-700">
                    {pt.age} yrs • {pt.gender}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 capitalize">
                  <HeartPulse className="w-3.5 h-3.5" /> Mobility: {pt.mobilityStatus}
                </div>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-xl text-sm border border-slate-200">
              <div>
                <span className="font-semibold text-slate-700 block text-xs uppercase tracking-wide">Medical History & Conditions</span>
                <p className="text-slate-800 text-sm mt-0.5">{pt.medicalHistory}</p>
              </div>
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-600">Emergency Contact:</span>
                  <p className="text-slate-900 font-medium">{pt.emergencyContactName}</p>
                  <p className="text-teal-700 font-bold">{pt.emergencyContactPhone}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Care Address:</span>
                  <p className="text-slate-900 font-medium truncate">{pt.address}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link to="/booking/new" className="btn-primary text-xs px-4 py-2">
                Book Care Shift
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
