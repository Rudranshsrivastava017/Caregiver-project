import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Lock, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const { login, googleLogin, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLoginSuccessRedirect = (authenticatedUser) => {
    if (authenticatedUser.role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (authenticatedUser.role === 'caregiver' && authenticatedUser.verificationStatus === 'pending') {
      navigate('/caregiver/verification-pending');
    } else {
      navigate(from, { replace: true });
    }
  };

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password);
      handleLoginSuccessRedirect(user);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      if (credentialResponse?.credential) {
        const user = await googleLogin(credentialResponse.credential);
        handleLoginSuccessRedirect(user);
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
    }
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

        {/* Google Sign-In Integration */}
        <div className="flex flex-col items-center w-full space-y-2">
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                console.warn('Google Sign-In failed or was closed.');
              }}
              shape="pill"
              theme="outline"
              size="large"
              text="continue_with"
              width="100%"
            />
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

        {/* 1-Click Demo Login Presets */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            1-Click Demo Login Presets
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setValue('email', 'vikram@careelderly.org');
                setValue('password', 'password123');
              }}
              className="text-xs bg-white border border-slate-300 hover:border-teal-600 hover:text-teal-800 font-bold py-2 px-2 rounded-xl transition-all cursor-pointer text-center shadow-2xs"
            >
              Family (Vikram)
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'anita.nurse@careelderly.org');
                setValue('password', 'password123');
              }}
              className="text-xs bg-white border border-slate-300 hover:border-teal-600 hover:text-teal-800 font-bold py-2 px-2 rounded-xl transition-all cursor-pointer text-center shadow-2xs"
            >
              Nurse (Anita)
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'admin@careelderly.org');
                setValue('password', 'password123');
              }}
              className="text-xs bg-white border border-slate-300 hover:border-teal-600 hover:text-teal-800 font-bold py-2 px-2 rounded-xl transition-all cursor-pointer text-center shadow-2xs"
            >
              Admin (Platform)
            </button>
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
