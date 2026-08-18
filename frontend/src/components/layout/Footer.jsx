import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ShieldCheck, PhoneCall, Mail, MapPin, CheckCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                <HeartPulse className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Care<span className="text-teal-400">Elderly</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Connecting senior citizens and families with verified healthcare professionals, nurses, and physiotherapists for safe, dignified in-home care.
            </p>
            <div className="inline-flex items-center gap-2 bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-3 py-1.5 rounded-lg text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Government ID Verified Caregivers
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wide border-b border-slate-800 pb-2">
              Our Services
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/services" className="hover:text-teal-400 transition-colors">Elderly Home Nursing</Link></li>
              <li><Link to="/services" className="hover:text-teal-400 transition-colors">Physiotherapy & Rehab</Link></li>
              <li><Link to="/services" className="hover:text-teal-400 transition-colors">General Attendant Care</Link></li>
              <li><Link to="/services" className="hover:text-teal-400 transition-colors">Dementia & Memory Care</Link></li>
              <li><Link to="/services" className="hover:text-teal-400 transition-colors">Post-Operative Support</Link></li>
            </ul>
          </div>

          {/* Platform & Roles */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wide border-b border-slate-800 pb-2">
              For Families & Nurses
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/register" className="hover:text-teal-400 transition-colors">Register as Family User</Link></li>
              <li><Link to="/register" className="hover:text-teal-400 transition-colors">Apply as Verified Caregiver</Link></li>
              <li><Link to="/patients/new" className="hover:text-teal-400 transition-colors">Add Elderly Patient Profile</Link></li>
              <li><Link to="/caregiver/verification-pending" className="hover:text-teal-400 transition-colors">ID Verification Status</Link></li>
              <li><Link to="/login" className="hover:text-teal-400 transition-colors">Portal Login</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wide border-b border-slate-800 pb-2">
              Emergency & Support
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <PhoneCall className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs text-slate-400 font-semibold uppercase">24/7 Helpline</span>
                  <a href="tel:18001234567" className="text-white font-bold hover:text-teal-300">1800-123-4567</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs text-slate-400 font-semibold uppercase">Support Email</span>
                  <a href="mailto:support@careelderly.org" className="text-white hover:text-teal-300">support@careelderly.org</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-400">Serving major metropolitan healthcare networks & home care districts.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>© 2026 CareElderly Healthcare Assistance Platform. Senior-friendly & accessible care management.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> WCAG 2.1 AA Compliant</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> JWT Encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
