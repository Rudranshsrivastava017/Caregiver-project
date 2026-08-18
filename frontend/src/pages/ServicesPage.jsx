import React from 'react';
import { MOCK_SERVICES } from '../data/mockData';
import { Stethoscope, Activity, HeartHandshake, Brain, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ServicesPage() {
  return (
    <div className="space-y-8 py-4">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Healthcare & Care Services</h1>
        <p className="text-slate-600 text-lg mt-2">
          Select from our catalog of verified in-home medical and non-medical elderly assistance options.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {MOCK_SERVICES.map((svc) => (
          <div key={svc.serviceId} className="card-senior flex flex-col justify-between hover:border-teal-500 transition-colors">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  {svc.serviceId === 'SVC001' && <Stethoscope className="w-6 h-6" />}
                  {svc.serviceId === 'SVC002' && <Activity className="w-6 h-6" />}
                  {svc.serviceId === 'SVC003' && <HeartHandshake className="w-6 h-6" />}
                  {svc.serviceId === 'SVC004' && <Brain className="w-6 h-6" />}
                </div>
                <span className="bg-teal-100 text-teal-900 border border-teal-300 font-bold px-3 py-1 rounded-full text-xs uppercase">
                  {svc.category.replace('_', ' ')}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">{svc.serviceName}</h2>
                <p className="text-slate-600 text-base mt-2">{svc.description}</p>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-xl text-sm border border-slate-200">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Duration Shifts:</span>
                  <span className="text-slate-900 font-medium">{svc.durationOptions.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Required Staff:</span>
                  <span className="text-slate-900 font-medium">{svc.requiredQualification}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Rate</span>
                <span className="text-2xl font-extrabold text-slate-900">₹{svc.price}</span>
                <span className="text-xs text-slate-500"> / shift</span>
              </div>
              <Link to="/booking/new" className="btn-primary">
                <span>Book This Service</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
