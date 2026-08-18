import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">404 - Page Not Found</h1>
        <p className="text-slate-600 text-base mt-2">
          The requested healthcare portal page does not exist or has been moved.
        </p>
      </div>
      <Link to="/" className="btn-primary inline-flex items-center gap-2">
        <Home className="w-4 h-4" />
        <span>Return to Homepage</span>
      </Link>
    </div>
  );
}
