import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, MailCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your email address, please wait...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in URL. Please check your verification email link.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axiosClient.post('/auth/verify-email', { token });
        if (response.data?.status === 'success') {
          setStatus('success');
          setMessage(response.data.message || 'Email verified successfully! You now have fully verified access.');
          toast.success('Email verified successfully!');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification token is invalid or has expired. Please request a new link.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Verifying Email...</h1>
            <p className="text-slate-600 text-sm">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Email Verified!</h1>
            <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
            <div className="pt-2">
              <Link
                to={user ? '/dashboard' : '/login'}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base font-bold shadow-md hover:shadow-lg transition-all"
              >
                <span>{user ? 'Proceed to Dashboard' : 'Sign In to Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Verification Failed</h1>
            <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
            <div className="pt-2 space-y-2">
              <Link
                to="/dashboard"
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
              >
                <span>Return to Dashboard</span>
              </Link>
              <Link
                to="/login"
                className="btn-outline w-full py-2.5 flex items-center justify-center gap-2 text-xs text-slate-600"
              >
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
