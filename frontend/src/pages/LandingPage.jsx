import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, HeartPulse, Stethoscope, Activity, HeartHandshake, FileText, Award, PhoneCall, ArrowRight, CheckCircle2 } from 'lucide-react';
import { MOCK_SERVICES, MOCK_CAREGIVERS } from '../data/mockData';

export default function LandingPage() {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-teal-700/50">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-200 border border-teal-400/30 px-4 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Government ID Verified Healthcare Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Compassionate In-Home Nursing & Care for Your Loved Ones
          </h1>

          <p className="text-lg sm:text-xl text-teal-100/90 leading-relaxed font-normal">
            Connecting senior citizens and families with background-verified nurses, certified physiotherapists, and dedicated attendants for dignified home care.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <Link to="/services" className="btn-primary bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-4 text-lg rounded-xl shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-105">
              <span>Book Care Service</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/register" className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 font-semibold px-6 py-4 text-lg rounded-xl flex items-center justify-center gap-2 backdrop-blur-sm transition-colors">
              <span>Join as Verified Caregiver</span>
            </Link>
          </div>

          {/* Quick Metrics / Trust Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-8 border-t border-teal-700/60 text-slate-200">
            <div>
              <span className="block text-2xl sm:text-3xl font-extrabold text-white">100%</span>
              <span className="text-xs sm:text-sm text-teal-200">Legal ID Verified</span>
            </div>
            <div>
              <span className="block text-2xl sm:text-3xl font-extrabold text-white">4.9 ★</span>
              <span className="text-xs sm:text-sm text-teal-200">Average Patient Rating</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block text-2xl sm:text-3xl font-extrabold text-white">24/7</span>
              <span className="text-xs sm:text-sm text-teal-200">Vitals & Care Notes Log</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights - Senior-Friendly Principles */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900">
            Designed for Seniors & Caring Families
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Safety, simplicity, and continuous care built directly into every step.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-senior border-t-4 border-t-teal-600 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Identity & Certification Security</h3>
            <p className="text-slate-600 text-base leading-relaxed">
              Every caregiver must undergo government legal ID validation and professional medical credential checks prior to account activation.
            </p>
          </div>

          <div className="card-senior border-t-4 border-t-blue-600 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Transparent Care Notes & Vitals</h3>
            <p className="text-slate-600 text-base leading-relaxed">
              Caregivers log session vitals, medications administered, and exercise progress so family members stay updated in real time.
            </p>
          </div>

          <div className="card-senior border-t-4 border-t-purple-600 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <HeartPulse className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Senior-Friendly Accessibility</h3>
            <p className="text-slate-600 text-base leading-relaxed">
              High contrast UI, large legible text, simple step-by-step navigation, and direct phone helpline support for complete peace of mind.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Services Catalog Preview */}
      <section className="space-y-8 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="text-teal-700 font-bold text-sm tracking-wider uppercase">Care Services</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Available Home Healthcare Services
            </h2>
          </div>
          <Link to="/services" className="btn-outline text-sm">
            View All Services →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_SERVICES.slice(0, 3).map((service) => (
            <div key={service.serviceId} className="card-senior flex flex-col justify-between hover:border-teal-400 transition-colors">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    {service.serviceId === 'SVC001' && <Stethoscope className="w-6 h-6" />}
                    {service.serviceId === 'SVC002' && <Activity className="w-6 h-6" />}
                    {service.serviceId === 'SVC003' && <HeartHandshake className="w-6 h-6" />}
                  </div>
                  <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-full uppercase">
                    {service.category.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{service.serviceName}</h3>
                  <p className="text-slate-600 text-sm mt-1 line-clamp-2">{service.description}</p>
                </div>
                <div className="text-xs text-slate-500 bg-slate-100 p-2.5 rounded-lg">
                  <span className="font-semibold text-slate-700">Req. Qualification:</span> {service.requiredQualification}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Starting from</span>
                  <span className="text-xl font-extrabold text-slate-900">₹{service.price}</span>
                  <span className="text-xs text-slate-500"> / shift</span>
                </div>
                <Link to={`/services`} className="btn-primary text-xs px-4 py-2">
                  Book Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* End-to-End Workflow Section */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-teal-700 font-bold text-sm tracking-wider uppercase">Simple 4-Step Process</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How CareElderly Works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center mb-4">1</span>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Create Patient Profile</h3>
            <p className="text-slate-600 text-sm">Add medical history, age, emergency contact, and mobility requirements.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center mb-4">2</span>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Select Service & Nurse</h3>
            <p className="text-slate-600 text-sm">Browse verified nurses and physiotherapists filtered by experience and location.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center mb-4">3</span>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Schedule & Confirm</h3>
            <p className="text-slate-600 text-sm">Pick date and shift duration. Receive instant booking confirmation notifications.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center mb-4">4</span>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Receive Care Notes</h3>
            <p className="text-slate-600 text-sm">Caregiver delivers service, logs vitals, and sends progress reports after every session.</p>
          </div>
        </div>
      </section>

      {/* Verified Caregiver Highlight */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Award className="w-4 h-4 text-emerald-400" /> Verified Medical Staff
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Top Rated Healthcare Professionals</h2>
          </div>
          <Link to="/caregivers" className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
            Browse All Caregivers
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_CAREGIVERS.map((cg) => (
            <div key={cg.caregiverId} className="bg-slate-800/90 border border-slate-700 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-4">
                <img src={cg.photoUrl} alt={cg.fullName} className="w-14 h-14 rounded-full object-cover border-2 border-teal-500" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-white text-base">{cg.fullName}</h3>
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  </div>
                  <p className="text-xs text-teal-300 font-semibold">{cg.qualification}</p>
                  <p className="text-xs text-slate-400">{cg.yearsExperience} Years Exp.</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{cg.bio}</p>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-700">
                <span className="text-amber-400 font-bold">★ {cg.rating} ({cg.reviewsCount} reviews)</span>
                <span className="text-slate-400">{cg.serviceAreas[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Direct Contact Banner */}
      <section className="bg-teal-50 border-2 border-teal-200 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-2xl font-bold text-teal-950">Need Immediate Healthcare Assistance?</h3>
          <p className="text-slate-700 text-base">Our care coordination team is available 24/7 to help you choose the right caregiver.</p>
        </div>
        <a href="tel:18001234567" className="btn-primary bg-teal-800 hover:bg-teal-900 text-white font-bold px-6 py-3.5 text-base rounded-xl whitespace-nowrap shadow-md">
          <PhoneCall className="w-5 h-5 text-amber-300" />
          <span>Call 1800-123-4567</span>
        </a>
      </section>
    </div>
  );
}
