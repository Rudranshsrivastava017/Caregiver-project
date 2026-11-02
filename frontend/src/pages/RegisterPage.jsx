import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { toast } from 'sonner';
import {
  ShieldCheck,
  UserCheck,
  Users,
  FileUp,
  ArrowRight,
  Mail,
  KeyRound,
  CheckCircle2,
  RotateCw,
  Lock,
} from 'lucide-react';

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

  // OTP Verification States (Phase 5)
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSimulatedOtp, setIsSimulatedOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'user',
    },
  });

  const emailValue = watch('email') || '';

  // 60-second cooldown timer effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  const handleRoleChange = (role) => {
    if (role !== selectedRole && isEmailVerified) {
      // Role changed after verification: require re-verification for the new role to enforce role binding
      setIsEmailVerified(false);
      setVerificationToken(null);
      setIsOtpSent(false);
      setIsSimulatedOtp(false);
      setOtpCode('');
      toast.info(`Switched to ${role === 'user' ? 'Family Member' : 'Healthcare Professional'}. Please re-verify email.`);
    }
    setSelectedRole(role);
    setValue('role', role);
  };

  // Step 1: Send OTP over SMTP
  const handleSendOtp = async () => {
    const emailTrimmed = emailValue.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailTrimmed)) {
      toast.error('Please enter a valid email address first.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const otpRole = selectedRole === 'caregiver' ? 'nurse' : 'family';
      const response = await axiosClient.post('/auth/otp/send', {
        email: emailTrimmed,
        role: otpRole,
      });

      setIsOtpSent(true);
      setIsSimulatedOtp(!!response.data.simulated);
      setResendCooldown(60);
      if (response.data.simulated) {
        toast.info(response.data.message || 'OTP generated! In dev mode, check backend terminal for code.');
      } else {
        toast.success(response.data.message || 'OTP sent to your email!');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Could not send verification code. Please try again.';
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otpCode.trim())) {
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const otpRole = selectedRole === 'caregiver' ? 'nurse' : 'family';
      const response = await axiosClient.post('/auth/otp/verify', {
        email: emailValue.trim().toLowerCase(),
        role: otpRole,
        otp: otpCode.trim(),
      });

      setVerificationToken(response.data.verificationToken);
      setIsEmailVerified(true);
      toast.success('Email verified successfully! You can now complete registration.');
    } catch (error) {
      const msg = error.response?.data?.message || 'Verification failed. Please check the code and try again.';
      toast.error(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Reset verified email in case user makes a typo
  const handleResetEmail = () => {
    setIsEmailVerified(false);
    setVerificationToken(null);
    setIsOtpSent(false);
    setIsSimulatedOtp(false);
    setOtpCode('');
  };

  // Final submit handler
  const onSubmit = async (data) => {
    if (!isEmailVerified || !verificationToken) {
      toast.error('Please verify your email address with the OTP before completing registration.');
      return;
    }

    try {
      const user = await registerAuth({ ...data, verificationToken });
      if (user.role === 'caregiver') {
        navigate('/caregivers');
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
          <p className="text-slate-600 text-sm">Select your role and verify your email to register.</p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => handleRoleChange('user')}
            className={`py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'user'
                ? 'bg-white text-teal-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Family Member</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('caregiver')}
            className={`py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedRole === 'caregiver'
                ? 'bg-white text-teal-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Healthcare Professional</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('role')} value={selectedRole} />

          {/* Full Name */}
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

          {/* Email Address with 2-Step OTP Verification */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold text-slate-700">Email Address</label>
              {isEmailVerified && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Email Verified
                  </span>
                  <button
                    type="button"
                    onClick={handleResetEmail}
                    className="text-xs text-slate-500 hover:text-teal-700 underline font-medium cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  {...register('email')}
                  type="email"
                  placeholder="anita@example.com"
                  readOnly={isEmailVerified}
                  className={`w-full px-4 py-3 rounded-xl border text-base transition-colors ${
                    isEmailVerified
                      ? 'bg-slate-50 border-emerald-300 text-slate-700 font-medium'
                      : 'border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600'
                  }`}
                />
                {isEmailVerified && (
                  <Lock className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {!isEmailVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || resendCooldown > 0}
                  className="px-4 py-3 bg-teal-800 text-white rounded-xl text-sm font-bold hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isSendingOtp ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : resendCooldown > 0 ? (
                    <span>Wait {resendCooldown}s</span>
                  ) : isOtpSent ? (
                    <>
                      <RotateCw className="w-4 h-4" />
                      <span>Resend OTP</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send OTP</span>
                    </>
                  )}
                </button>
              )}
            </div>
            {errors.email && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.email.message}</p>}
          </div>

          {/* 6-Digit OTP Input & Verification Card (Shown once OTP is dispatched) */}
          {isOtpSent && !isEmailVerified && (
            <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 text-teal-950 font-bold text-sm">
                <KeyRound className="w-4 h-4 text-teal-700" />
                <span>Enter 6-Digit Verification Code</span>
              </div>
              <p className="text-xs text-slate-600">
                We sent a verification code to <strong className="text-slate-800">{emailValue}</strong>. The code expires in 10 minutes.
              </p>

              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-40 py-2.5 px-3 text-center tracking-[0.35em] font-mono text-xl font-bold bg-white rounded-lg border border-teal-300 focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className="px-5 py-2.5 bg-teal-700 text-white rounded-lg font-bold text-sm hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isVerifyingOtp ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify</span>
                    </>
                  )}
                </button>
              </div>

              {isSimulatedOtp && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <span className="font-bold">ℹ️ Dev Mode:</span>
                  <span>Email service is simulated. Check your backend console terminal for the 6-digit code.</span>
                </div>
              )}

              {resendCooldown > 0 && (
                <p className="text-[11px] text-slate-500">
                  Didn't receive the email? You can request a new code in <strong>{resendCooldown}s</strong> (check spam folder as well).
                </p>
              )}
            </div>
          )}

          {/* Phone Number */}
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

          {/* Create Password */}
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

          {/* Submit Button */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isLoading || !isEmailVerified}
              className={`btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 transition-all ${
                !isEmailVerified
                  ? 'opacity-60 cursor-not-allowed bg-slate-400 hover:bg-slate-400'
                  : 'cursor-pointer'
              }`}
            >
              <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!isEmailVerified && (
              <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Verify your email with the 6-digit OTP above to enable registration</span>
              </p>
            )}
          </div>
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
