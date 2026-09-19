import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  HeartPulse,
  Phone,
  MapPin,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const patientSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  age: z
    .coerce
    .number({ invalid_type_error: 'Age must be a number' })
    .min(1, 'Age must be at least 1')
    .max(125, 'Please enter a valid age'),
  gender: z.enum(['Male', 'Female', 'Other'], {
    errorMap: () => ({ message: 'Please select gender' }),
  }),
  mobilityStatus: z.enum(['independent', 'assisted', 'bedridden'], {
    errorMap: () => ({ message: 'Please select mobility status' }),
  }),
  medicalHistory: z.string().optional(),
  emergencyContactName: z
    .string()
    .min(2, 'Emergency contact name must be at least 2 characters'),
  emergencyContactPhone: z
    .string()
    .min(10, 'Please enter a valid 10-digit phone number'),
  address: z.string().min(5, 'Care address must be at least 5 characters'),
  photoUrl: z.string().optional(),
});

const PRESET_AVATARS = [
  {
    label: 'Senior Male 1',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  },
  {
    label: 'Senior Female 1',
    url: 'https://images.unsplash.com/photo-1566616213894-269115ecf328?auto=format&fit=crop&w=300&q=80',
  },
  {
    label: 'Senior Male 2',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    label: 'Senior Female 2',
    url: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=300&q=80',
  },
];

export default function PatientForm({
  initialData = null,
  onSubmit,
  isSubmitting = false,
  onCancel,
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      age: initialData?.age || '',
      gender: initialData?.gender || 'Male',
      mobilityStatus: initialData?.mobilityStatus || 'assisted',
      medicalHistory: initialData?.medicalHistory || '',
      emergencyContactName: initialData?.emergencyContactName || '',
      emergencyContactPhone: initialData?.emergencyContactPhone || '',
      address: initialData?.address || '',
      photoUrl: initialData?.photoUrl || PRESET_AVATARS[0].url,
    },
  });

  const selectedMobility = watch('mobilityStatus');
  const selectedPhoto = watch('photoUrl');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section 1: Basic Information */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Basic Elderly Profile
            </h2>
            <p className="text-xs text-slate-500">
              General identifying information for the patient receiving care.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('fullName')}
              placeholder="e.g. Ramesh Sharma"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-base"
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 font-semibold mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Age (Years) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register('age')}
              placeholder="e.g. 76"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-base"
            />
            {errors.age && (
              <p className="text-xs text-red-600 font-semibold mt-1">
                {errors.age.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              {...register('gender')}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-base bg-white"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && (
              <p className="text-xs text-red-600 font-semibold mt-1">
                {errors.gender.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Profile Photo Preset
            </label>
            <div className="flex items-center gap-3">
              {PRESET_AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setValue('photoUrl', avatar.url)}
                  className={`relative rounded-full p-0.5 transition-all cursor-pointer ${
                    selectedPhoto === avatar.url
                      ? 'ring-3 ring-teal-600 scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title={avatar.label}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.label}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {selectedPhoto === avatar.url && (
                    <div className="absolute -bottom-1 -right-1 bg-teal-600 text-white rounded-full p-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Mobility Status */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Mobility & Physical Independence
            </h2>
            <p className="text-xs text-slate-500">
              Crucial for assigning suitably qualified nurses and attendants.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label
            onClick={() => setValue('mobilityStatus', 'independent')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              selectedMobility === 'independent'
                ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Independent
              </span>
              <input
                type="radio"
                value="independent"
                {...register('mobilityStatus')}
                className="text-teal-600 focus:ring-teal-500"
              />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">
                Self-Mobile
              </p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Able to walk and carry out basic personal tasks unassisted.
              </p>
            </div>
          </label>

          <label
            onClick={() => setValue('mobilityStatus', 'assisted')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              selectedMobility === 'assisted'
                ? 'border-amber-600 bg-amber-50/60 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Assisted
              </span>
              <input
                type="radio"
                value="assisted"
                {...register('mobilityStatus')}
                className="text-teal-600 focus:ring-teal-500"
              />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">
                Assisted Mobility
              </p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Needs physical support, walker, cane, or help with transfers & bathing.
              </p>
            </div>
          </label>

          <label
            onClick={() => setValue('mobilityStatus', 'bedridden')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              selectedMobility === 'bedridden'
                ? 'border-rose-600 bg-rose-50/60 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                Bedridden
              </span>
              <input
                type="radio"
                value="bedridden"
                {...register('mobilityStatus')}
                className="text-teal-600 focus:ring-teal-500"
              />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">
                Full Bed-Care
              </p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Requires complete bed assistance, turning, sponge baths, and vitals monitoring.
              </p>
            </div>
          </label>
        </div>
        {errors.mobilityStatus && (
          <p className="text-xs text-red-600 font-semibold mt-1">
            {errors.mobilityStatus.message}
          </p>
        )}
      </div>

      {/* Section 3: Medical History & Chronic Conditions */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Medical History & Health Details
            </h2>
            <p className="text-xs text-slate-500">
              Provide chronic conditions, past surgeries, or allergies to guide caregivers.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Medical History & Care Notes
          </label>
          <textarea
            rows={4}
            {...register('medicalHistory')}
            placeholder="e.g. Hypertension, Type-2 Diabetes on oral medication. Recovering from right hip replacement surgery. Mild memory lapses in evening."
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-base"
          />
          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Caregivers can view these clinical notes prior to accepting shifts.</span>
          </p>
        </div>
      </div>

      {/* Section 4: Emergency Contact & Address */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Emergency Contact & Care Address
            </h2>
            <p className="text-xs text-slate-500">
              Contact and location coordinates for home care delivery.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Emergency Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('emergencyContactName')}
              placeholder="e.g. Vikram Sharma (Son)"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-base"
            />
            {errors.emergencyContactName && (
              <p className="text-xs text-red-600 font-semibold mt-1">
                {errors.emergencyContactName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Emergency Contact Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register('emergencyContactPhone')}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-base"
            />
            {errors.emergencyContactPhone && (
              <p className="text-xs text-red-600 font-semibold mt-1">
                {errors.emergencyContactPhone.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Complete Home Care Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('address')}
            placeholder="e.g. 42-B Parkview Apartments, Green Park, New Delhi - 110016"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-base"
          />
          {errors.address && (
            <p className="text-xs text-red-600 font-semibold mt-1">
              {errors.address.message}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-outline px-6 py-3 cursor-pointer text-base"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary px-8 py-3 text-base flex items-center gap-2 cursor-pointer shadow-md"
        >
          <span>
            {isSubmitting
              ? 'Saving Profile...'
              : initialData
              ? 'Update Patient Profile'
              : 'Create Patient Profile'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
