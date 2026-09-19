import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import {
  ArrowLeft,
  Stethoscope,
  Activity,
  HeartHandshake,
  Brain,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Calendar,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchService = async () => {
      setIsLoading(true);
      try {
        const response = await axiosClient.get(`/services/${id}`);
        if (response.data?.status === 'success' && isMounted) {
          setService(response.data.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || 'Healthcare service not found.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchService();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-teal-700 animate-spin" />
        <p className="text-slate-600 font-semibold text-sm">
          Loading service details...
        </p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Service Not Found</h2>
        <p className="text-slate-600 text-sm">
          The healthcare service you requested does not exist or has been retired.
        </p>
        <Link to="/services" className="btn-primary inline-block">
          Return to Service Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Back Button */}
      <Link
        to="/services"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Healthcare Catalog</span>
      </Link>

      {/* Main Service Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <span className="bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {service.category?.replace('_', ' ')}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900">
              {service.serviceName}
            </h1>
          </div>

          <div className="text-left sm:text-right bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs text-slate-500 block font-medium">Estimated Pricing</span>
            <span className="text-3xl font-black text-slate-900">₹{service.price}</span>
            <span className="text-xs text-slate-500"> / shift</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Service Overview</h2>
          <p className="text-slate-700 text-base leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Shift Durations & Professional Requirements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Available Shift Durations</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {Array.isArray(service.durationOptions) ? (
                service.durationOptions.map((opt, i) => (
                  <span
                    key={i}
                    className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold px-3 py-1 rounded-lg"
                  >
                    {opt}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-800 font-medium">
                  {service.durationOptions}
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Required Clinical Qualification</span>
            </div>
            <p className="text-sm font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-slate-300">
              {service.requiredQualification}
            </p>
          </div>
        </div>

        {/* Safety & Clinical Guarantee */}
        <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-teal-700" />
            <span>CareElderly Clinical Standard Guarantee</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Every shift assigned for this service is delivered strictly by professionals holding verified government identity documents and professional healthcare degrees. Session vitals and tasks are recorded in real-time care notes.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <Link
            to={`/booking/new?serviceId=${service.serviceId}`}
            className="btn-primary px-8 py-3.5 text-base flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Calendar className="w-5 h-5" />
            <span>Proceed to Schedule Shift</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
