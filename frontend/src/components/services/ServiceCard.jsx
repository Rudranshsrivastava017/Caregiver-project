import React from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Activity,
  HeartHandshake,
  Brain,
  ShieldCheck,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function ServiceCard({ service }) {
  const getCategoryIcon = (category, serviceId) => {
    if (serviceId === 'SVC001') return <Stethoscope className="w-6 h-6" />;
    if (serviceId === 'SVC002') return <Activity className="w-6 h-6" />;
    if (serviceId === 'SVC003') return <HeartHandshake className="w-6 h-6" />;
    if (serviceId === 'SVC004') return <Brain className="w-6 h-6" />;

    switch (category) {
      case 'medical':
        return <Stethoscope className="w-6 h-6" />;
      case 'rehabilitation':
        return <Activity className="w-6 h-6" />;
      case 'non_medical':
      default:
        return <HeartHandshake className="w-6 h-6" />;
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'medical':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'rehabilitation':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'non_medical':
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6 hover:border-teal-500">
      <div className="space-y-4">
        {/* Card Header: Icon & Category */}
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shadow-xs">
            {getCategoryIcon(service.category, service.serviceId)}
          </div>
          <div className="flex items-center gap-1.5">
            {service.isBooked && (
              <span className="font-bold px-2.5 py-1 rounded-full text-xs uppercase tracking-wider border bg-rose-50 text-rose-800 border-rose-200 shadow-2xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                <span>Booked</span>
              </span>
            )}
            <span
              className={`font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider border ${getCategoryBadgeClass(
                service.category
              )}`}
            >
              {service.category?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-snug">
            {service.serviceName}
          </h2>
          <p className="text-slate-600 text-sm mt-2 line-clamp-3 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Duration & Staff Requirements */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Shift Options:</span>
            </span>
            <span className="font-bold text-slate-900">
              {Array.isArray(service.durationOptions)
                ? service.durationOptions.join(', ')
                : service.durationOptions}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Required Staff:</span>
            </span>
            <span className="font-bold text-slate-900 truncate max-w-[180px]" title={service.requiredQualification}>
              {service.requiredQualification}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing & Call to Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-xs text-slate-500 block font-medium">Estimated Rate</span>
          <span className="text-2xl font-extrabold text-slate-900">₹{service.price}</span>
          <span className="text-xs text-slate-500"> / shift</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/services/${service.serviceId}`}
            className="btn-outline text-xs px-3 py-2.5 flex items-center gap-1 text-slate-700"
            title="View Details"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Details</span>
          </Link>

          <Link
            to={`/booking/new?serviceId=${service.serviceId}`}
            className={`text-xs px-4 py-2.5 flex items-center gap-1.5 font-bold rounded-xl transition-all shadow-xs ${
              service.isBooked
                ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                : 'btn-primary'
            }`}
          >
            <span>{service.isBooked ? 'Booked' : 'Book Care'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
