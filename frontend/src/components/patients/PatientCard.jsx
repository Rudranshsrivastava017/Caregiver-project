import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  User,
  Phone,
  MapPin,
  FileText,
  Edit,
  Trash2,
  Calendar,
  ShieldAlert,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function PatientCard({ patient, onDelete }) {
  const getMobilityBadge = (status) => {
    switch (status) {
      case 'independent':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Independent Mobility</span>
          </span>
        );
      case 'bedridden':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Bedridden / Full Assistance</span>
          </span>
        );
      case 'assisted':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <HeartPulse className="w-3.5 h-3.5 text-amber-600" />
            <span>Assisted Mobility Required</span>
          </span>
        );
    }
  };

  const defaultPhoto =
    patient.gender?.toLowerCase() === 'female'
      ? 'https://images.unsplash.com/photo-1566616213894-269115ecf328?auto=format&fit=crop&w=300&q=80'
      : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5">
      <div className="space-y-4">
        {/* Top Row: Avatar, Name, Age, Gender & Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <img
              src={patient.photoUrl || defaultPhoto}
              alt={patient.fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-teal-600 shadow-xs"
              onError={(e) => {
                e.target.src = defaultPhoto;
              }}
            />
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {patient.fullName}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">
                  {patient.age} yrs
                </span>
                <span>•</span>
                <span className="capitalize">{patient.gender}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to={`/patients/${patient.patientId || patient._id}/edit`}
              className="p-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
              title="Edit Profile"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => onDelete(patient)}
              className="p-2 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
              title="Delete Profile"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobility Status */}
        <div>{getMobilityBadge(patient.mobilityStatus)}</div>

        {/* Medical History Section */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
            <FileText className="w-3.5 h-3.5 text-teal-700" />
            <span>Medical History & Special Needs</span>
          </div>
          <p className="text-slate-800 text-sm leading-relaxed line-clamp-3">
            {patient.medicalHistory || 'No special medical conditions or allergies recorded.'}
          </p>
        </div>

        {/* Emergency Contact & Address Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
              Emergency Contact
            </span>
            <p className="font-bold text-slate-900 truncate">
              {patient.emergencyContactName}
            </p>
            <a
              href={`tel:${patient.emergencyContactPhone}`}
              className="inline-flex items-center gap-1 text-teal-800 font-semibold hover:underline mt-0.5"
            >
              <Phone className="w-3.5 h-3.5 text-teal-700" />
              <span>{patient.emergencyContactPhone}</span>
            </a>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Care Delivery Address
            </span>
            <p className="text-slate-800 font-medium line-clamp-2 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>{patient.address}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Card Footer: Book Shift Button */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 font-mono">
          ID: {patient.patientId || patient._id}
        </span>
        <Link
          to={`/booking/new?patientId=${patient.patientId || patient._id}`}
          className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Care Shift</span>
        </Link>
      </div>
    </div>
  );
}
