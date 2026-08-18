import React from 'react';
import { Clock, ShieldAlert, FileText, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CaregiverPendingPage() {
  return (
    <div className="max-w-lg mx-auto py-12 text-center">
      <div className="card-senior space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border-2 border-amber-300">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="badge-pending text-xs uppercase tracking-wider font-bold">Verification Pending</span>
          <h1 className="text-2xl font-extrabold text-slate-900">Legal ID & Credentials Under Review</h1>
          <p className="text-slate-600 text-base leading-relaxed">
            Thank you for registering as a caregiver with CareElderly! Your government legal ID document and nursing certifications are currently undergoing administrative verification.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 text-slate-700">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Why is this required?</span>
          </div>
          <p>
            To ensure maximum safety for senior citizens, our medical safety board verifies every identity before granting access to patient homes and care requests.
          </p>
          <p className="font-semibold text-teal-800">
            Estimated turnaround time: 24 - 48 business hours.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link to="/" className="btn-outline w-full text-sm">
            Return to Homepage
          </Link>
          <a href="tel:18001234567" className="text-xs text-slate-500 font-semibold hover:text-teal-700 flex items-center justify-center gap-1">
            <PhoneCall className="w-3.5 h-3.5" /> Helpline Support: 1800-123-4567
          </a>
        </div>
      </div>
    </div>
  );
}
