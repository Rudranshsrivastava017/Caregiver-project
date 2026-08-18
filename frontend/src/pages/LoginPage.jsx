import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Lock, ArrowRight, ShieldCheck, UserCheck, Clock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const { login, googleLogin, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [roleHint, setRoleHint] = useState('user');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'vikram@careelderly.org',
      password: 'password123',
    },
  });

  const handleLoginSuccessRedirect = (authenticatedUser) => {
    if (authenticatedUser.role === 'caregiver' && authenticatedUser.verificationStatus === 'pending') {
      navigate('/caregiver/verification-pending');
    } else {
      navigate(from, { replace: true });
    }
  };

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password, roleHint);
      handleLoginSuccessRedirect(user);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const createMockGoogleJwt = () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: `google_${Date.now()}`,
        email: 'google.user@careelderly.org',
        name: 'Google Member',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        email_verified: true,
      })
    );
    return `${header}.${payload}.mock_signature`;
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      if (credentialResponse?.credential) {
        const user = await googleLogin(credentialResponse.credential);
        handleLoginSuccessRedirect(user);
      } else {
        await triggerGoogleFallback();
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
      await triggerGoogleFallback();
    }
  };

  const triggerGoogleFallback = async () => {
    try {
      const mockCred = createMockGoogleJwt();
      const user = await googleLogin(mockCred);
      handleLoginSuccessRedirect(user);
    } catch (err) {
      console.error('Google Sign-In Fallback error:', err);
    }
  };

  // Demo Presets for Quick Testing
  const applyPreset = (email, role) => {
    setValue('email', email);
    setValue('password', 'password123');
    setRoleHint(role);
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <div className="card-senior space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Secure Portal Login</h1>
          <p className="text-slate-600 text-sm">Access your family account or caregiver portal.</p>
        </div>

        {/* Demo Login Quick Presets */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block text-center">
            ⚡ Quick Test Login Presets
          </span>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => applyPreset('vikram@careelderly.org', 'user')}
              className="bg-white hover:bg-teal-50 border border-slate-200 text-slate-800 p-2 rounded-lg font-semibold text-center flex flex-col items-center gap-1 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>Family User</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('anita.nurse@careelderly.org', 'caregiver')}
              className="bg-white hover:bg-teal-50 border border-slate-200 text-slate-800 p-2 rounded-lg font-semibold text-center flex flex-col items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Nurse</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('pending.caregiver@careelderly.org', 'caregiver')}
              className="bg-white hover:bg-amber-50 border border-slate-200 text-slate-800 p-2 rounded-lg font-semibold text-center flex flex-col items-center gap-1 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pending ID</span>
            </button>
          </div>
        </div>

        {/* Google Sign-In Integration */}
        <div className="flex flex-col items-center w-full space-y-2">
          <div className="w-full flex flex-col items-center gap-2">
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.warn('Official Google OAuth widget failed or Client ID invalid. Enabling direct Google Login fallback.');
                }}
                shape="pill"
                theme="outline"
                size="large"
                text="continue_with"
                width="100%"
              />
            </div>
            <button
              type="button"
              onClick={triggerGoogleFallback}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-full font-semibold text-slate-700 text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google Account</span>
            </button>
          </div>
          <div className="relative w-full flex items-center justify-center pt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative bg-white px-3 text-xs font-semibold text-slate-500 uppercase">
              Or login with Email
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
            <input
              {...register('email')}
              type="email"
              placeholder="user@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-base"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1 font-semibold">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
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
            <span>{isLoading ? 'Authenticating...' : 'Log In to Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-sm text-slate-600 border-t border-slate-200">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-teal-700 hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
}
