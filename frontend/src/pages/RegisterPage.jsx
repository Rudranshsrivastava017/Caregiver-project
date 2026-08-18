import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Users, FileUp, ArrowRight } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid 10-digit phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'caregiver']),
  legalIdNumber: z.string().optional(),
  qualification: z.string().optional(),
  yearsExperience: z.string().optional(),
}).superRefine((data, ctx) => {
  // Caregiver registration mandates Legal ID number as per Section 5 of Spec
  if (data.role === 'caregiver') {
    if (!data.legalIdNumber || data.legalIdNumber.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['legalIdNumber'],
        message: 'Caregivers must provide a valid Government Legal ID number',
      });
    }
  }
});

export default function RegisterPage() {
  const { register: registerAuth, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('user');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'user',
    },
  });

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data) => {
    try {
      const user = await registerAuth(data);
      if (user.role === 'caregiver' && user.verificationStatus === 'pending') {
        navigate('/caregiver/verification-pending');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div className="card-senior space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create CareElderly Account</h1>
          <p className="text-slate-600 text-sm">Select your role to start registration.</p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => handleRoleChange('user')}
            className={`py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'user' ? 'bg-white text-teal-800 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Family Member</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('caregiver')}
            className={`py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'caregiver' ? 'bg-white text-teal-800 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Healthcare Professional</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('role')} value={selectedRole} />

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
            <input
              {...register('fullName')}
              type="text"
              placeholder="e.g. Anita Sharma"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-base"
            />
            {errors.fullName && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
            <input
              {...register('email')}
              type="email"
              placeholder="anita@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-base"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-base"
            />
            {errors.phone && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.phone.message}</p>}
          </div>

          {/* Conditional Caregiver Legal ID & Verification Section */}
          {selectedRole === 'caregiver' && (
            <div className="space-y-3 bg-amber-50/90 p-4 rounded-xl border border-amber-200 text-sm">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <span>Caregiver Legal ID & Certification Verification</span>
              </div>
              <p className="text-slate-700 text-xs leading-relaxed">
                As per Section 5 of the platform safety mandate, all nurses and attendants must submit a government legal ID and certification scan. Your account will remain in <strong className="text-amber-900">pending verification</strong> until approved.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Government Legal ID Number (Aadhaar / Passport / Voter ID) <span className="text-red-600">*</span>
                </label>
                <input
                  {...register('legalIdNumber')}
                  type="text"
                  placeholder="e.g. AADHAAR-1234-5678-9012"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-amber-500"
                />
                {errors.legalIdNumber && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.legalIdNumber.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qualification / Degree</label>
                  <input
                    {...register('qualification')}
                    type="text"
                    placeholder="e.g. B.Sc Nursing / DPT"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Years of Experience</label>
                  <input
                    {...register('yearsExperience')}
                    type="number"
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Upload Legal ID & Certificate PDF Scan</label>
                <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 text-center bg-white cursor-pointer hover:border-teal-600 transition-colors">
                  <FileUp className="w-6 h-6 text-amber-700 mx-auto mb-1" />
                  <span className="text-xs text-slate-700 font-semibold block">Click to select government ID PDF scan</span>
                  <span className="text-[10px] text-slate-500 block">Accepted formats: PDF, JPG, PNG (Max 5MB)</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Create Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-base"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-sm text-slate-600 border-t border-slate-200">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-teal-700 hover:underline">
            Log In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
