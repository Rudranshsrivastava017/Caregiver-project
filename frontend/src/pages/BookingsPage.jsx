import React from 'react';
import { MOCK_BOOKINGS, MOCK_CARE_NOTES } from '../data/mockData';
import { Calendar, User, Stethoscope, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

export default function BookingsPage() {
  return (
    <div className="space-y-8 py-4">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Service Bookings & Status Tracker</h1>
        <p className="text-slate-600 text-lg mt-1">
          Monitor incoming and active care shifts, view caregiver status, and read logged care notes.
        </p>
      </div>

      <div className="space-y-6">
        {MOCK_BOOKINGS.map((bk) => {
          const notes = MOCK_CARE_NOTES.filter(n => n.bookingId === bk.bookingId);
          return (
            <div key={bk.bookingId} className="card-senior space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">{bk.serviceName}</h2>
                    <span className={`
                      ${bk.status === 'confirmed' ? 'badge-confirmed' : ''}
                      ${bk.status === 'in_progress' ? 'badge-in-progress' : ''}
                      ${bk.status === 'completed' ? 'badge-completed' : ''}
                      ${bk.status === 'pending' ? 'badge-pending' : ''}
                    `}>
                      {bk.status === 'confirmed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {bk.status === 'in_progress' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span className="capitalize">{bk.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono mt-0.5 block">Booking ID: {bk.bookingId}</span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Amount</span>
                  <span className="text-xl font-extrabold text-slate-900">₹{bk.totalPrice}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded ml-2 uppercase">
                    {bk.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Patient</span>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-teal-600" />
                    {bk.patientName}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Assigned Caregiver</span>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    {bk.caregiverName}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-semibold block uppercase">Scheduled Shift</span>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    {bk.scheduledDate} ({bk.scheduledTime})
                  </p>
                </div>
              </div>

              {/* Logged Care Notes Section if available */}
              {notes.length > 0 && (
                <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                    <FileText className="w-4 h-4 text-teal-700" />
                    <span>Latest Care Note & Vitals Logged by Nurse</span>
                  </div>
                  {notes.map((n) => (
                    <div key={n.noteId} className="space-y-2 text-xs text-slate-800">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-lg border border-teal-200 font-mono">
                        <div><span className="text-slate-500 block">BP:</span> {n.vitals.bp}</div>
                        <div><span className="text-slate-500 block">Pulse:</span> {n.vitals.pulse}</div>
                        <div><span className="text-slate-500 block">Temp:</span> {n.vitals.temperature}</div>
                        <div><span className="text-slate-500 block">Sugar:</span> {n.vitals.sugarLevel}</div>
                      </div>
                      <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-teal-200">
                        <span className="font-semibold text-slate-900 block mb-1">Observations:</span> {n.observations}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
