import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../api/axiosClient';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Activity,
  HeartPulse,
  Award,
  FileCheck,
  Stethoscope,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const [analyticsRes, pendingRes] = await Promise.all([
        axiosClient.get('/admin/analytics'),
        axiosClient.get('/admin/caregivers/pending'),
      ]);

      if (analyticsRes.data?.status === 'success') {
        setAnalytics(analyticsRes.data.data);
      }
      if (pendingRes.data?.status === 'success') {
        setPendingCount(pendingRes.data.count || pendingRes.data.data?.length || 0);
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
      toast.error(err.response?.data?.message || 'Failed to load administrative analytics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 space-y-8 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  const usersData = analytics?.users || {};
  const bookingsData = analytics?.bookings || {};
  const patientsData = analytics?.patients || {};
  const servicesData = analytics?.services || {};

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-bold text-sm uppercase tracking-wider">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Platform Operations & Metrics
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Real-time platform oversight, staff verification queue, and clinical shift management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="btn-outline flex items-center gap-2 px-4 py-2.5 text-sm"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin/verifications"
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm shadow-md"
          >
            <FileCheck className="w-4 h-4" />
            <span>Review Applications</span>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-amber-950 text-xs font-black px-2 py-0.5 rounded-full ml-1 animate-pulse">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Pending Applications Alert Banner if any */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-900">
                {pendingCount} Caregiver Application{pendingCount > 1 ? 's' : ''} Awaiting ID Verification
              </h2>
              <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                Government identity cards and nursing council registration documents require administrator sign-off.
              </p>
            </div>
          </div>
          <Link
            to="/admin/verifications"
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>Inspect Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Active Shifts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Care Shifts
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {bookingsData.activeBookings ?? 0}
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              In-Service
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {bookingsData.confirmed ?? 0} Confirmed • {bookingsData.inProgress ?? 0} Ongoing
          </p>
        </div>

        {/* Card 2: Verified Caregivers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Verified Caregivers
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {usersData.verifiedCaregivers ?? 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              of {usersData.totalCaregivers ?? 0} staff
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Nurses, PTs & Dementia Companions
          </p>
        </div>

        {/* Card 3: Pending Verifications */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Verification
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700">
              {pendingCount}
            </span>
            {pendingCount > 0 ? (
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                Action Required
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                All Cleared
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Healthcare licenses & ID uploads
          </p>
        </div>

        {/* Card 4: Total Patients Registered */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Registered Patients
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {patientsData.totalPatients ?? 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              across {usersData.familyUsers ?? 0} families
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Senior profiles with clinical history
          </p>
        </div>
      </div>

      {/* Operational Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bookings Lifecycle Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <span>Service Bookings Status Distribution</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of shifts across all lifecycle states
              </p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
              Total: {bookingsData.totalBookings ?? 0}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-xs font-bold text-amber-900 block uppercase">Pending</span>
              <span className="text-2xl font-black text-amber-800 mt-1 block">
                {bookingsData.pending ?? 0}
              </span>
              <span className="text-[11px] text-amber-700">Awaiting Caregiver</span>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <span className="text-xs font-bold text-blue-900 block uppercase">Confirmed</span>
              <span className="text-2xl font-black text-blue-800 mt-1 block">
                {bookingsData.confirmed ?? 0}
              </span>
              <span className="text-[11px] text-blue-700">Scheduled Shift</span>
            </div>

            <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
              <span className="text-xs font-bold text-teal-900 block uppercase">In-Progress</span>
              <span className="text-2xl font-black text-teal-800 mt-1 block">
                {bookingsData.inProgress ?? 0}
              </span>
              <span className="text-[11px] text-teal-700">Care Being Delivered</span>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-900 block uppercase">Completed</span>
              <span className="text-2xl font-black text-emerald-800 mt-1 block">
                {bookingsData.completed ?? 0}
              </span>
              <span className="text-[11px] text-emerald-700">Vitals & Notes Logged</span>
            </div>

            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
              <span className="text-xs font-bold text-rose-900 block uppercase">Cancelled</span>
              <span className="text-2xl font-black text-rose-800 mt-1 block">
                {bookingsData.cancelled ?? 0}
              </span>
              <span className="text-[11px] text-rose-700">Slot Released</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>Conflict prevention algorithm active (409 Slot Conflict Guard).</span>
            <Link to="/bookings" className="text-teal-700 font-bold hover:underline flex items-center gap-1">
              <span>View All Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* User Roles & Security Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <span>Platform Community</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                    FM
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Family Users</span>
                    <span className="text-xs text-slate-500">Managing elderly relatives</span>
                  </div>
                </div>
                <span className="text-lg font-black text-slate-800">
                  {usersData.familyUsers ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    CG
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Healthcare Staff</span>
                    <span className="text-xs text-slate-500">Nurses, PTs, attendants</span>
                  </div>
                </div>
                <span className="text-lg font-black text-slate-800">
                  {usersData.totalCaregivers ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    SV
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Catalog Services</span>
                    <span className="text-xs text-slate-500">Medical & Companion Care</span>
                  </div>
                </div>
                <span className="text-lg font-black text-slate-800">
                  {servicesData.totalServices ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Security & RBAC Enforcement Active</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Only verified caregivers receive patient booking alerts and clinical vital logging privileges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
