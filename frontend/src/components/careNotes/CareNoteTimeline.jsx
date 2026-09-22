import React, { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { useSocket } from '../../context/SocketContext';
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Droplet,
  CheckCircle2,
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';

export default function CareNoteTimeline({ bookingId }) {
  const { socket } = useSocket();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotes = useCallback(async (isManual = false) => {
    if (!bookingId) return;
    if (isManual) setIsRefreshing(true);
    try {
      const response = await axiosClient.get(`/care-notes/booking/${bookingId}`);
      if (response.data?.status === 'success') {
        setNotes(response.data.data || []);
      }
    } catch (err) {
      console.warn('Could not load care notes:', err.message);
      setError(err.response?.data?.message || 'Failed to load shift care notes.');
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Real-time listener: re-fetch immediately when careNote:added fires for this booking
  useEffect(() => {
    if (!socket) return;

    const handleCareNoteAdded = (data) => {
      if (data.bookingId === bookingId) {
        console.log('[CareNoteTimeline] Real-time event received, refreshing notes...');
        fetchNotes();
      }
    };

    socket.on('careNote:added', handleCareNoteAdded);

    return () => {
      socket.off('careNote:added', handleCareNoteAdded);
    };
  }, [socket, bookingId, fetchNotes]);

  if (isLoading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-500">
        <Activity className="w-6 h-6 text-teal-600 animate-pulse" />
        <span className="text-xs font-semibold">Loading clinical notes & vitals...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-700" />
          <h3 className="text-base font-bold text-slate-900">
            Shift Care Notes & Vitals Timeline
          </h3>
          <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
            {notes.length} {notes.length === 1 ? 'Entry' : 'Entries'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => fetchNotes(true)}
          disabled={isRefreshing}
          className="text-xs text-slate-500 hover:text-teal-700 flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Refresh care notes"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
          <span className="hidden sm:inline">Sync Notes</span>
        </button>
      </div>

      {/* Empty State */}
      {notes.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No shift logs recorded yet</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When the assigned healthcare caregiver takes vital signs, assists with medications, or adds clinical observations, they will appear here in real time.
          </p>
        </div>
      ) : (
        /* Timeline Feed */
        <div className="relative border-l-2 border-teal-200 ml-3.5 space-y-6 pl-6 py-2">
          {notes.map((note, index) => {
            const dateObj = new Date(note.timestamp || note.createdAt);
            const formattedDate = dateObj.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedTime = dateObj.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={note.noteId || index} className="relative group">
                {/* Timeline Marker Dot */}
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-teal-600 shadow-xs" />

                {/* Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 hover:border-teal-300 transition-all">
                  {/* Top Bar: Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{formattedTime}</span>
                      <span className="text-slate-300">•</span>
                      <span>{formattedDate}</span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400">
                      ID: #{note.noteId}
                    </span>
                  </div>

                  {/* Vitals Grid */}
                  {note.vitals && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {/* BP */}
                      <div className="bg-red-50/60 border border-red-100 rounded-xl p-2.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-red-700 mb-0.5">
                          <Heart className="w-3.5 h-3.5 text-red-500" />
                          <span>Blood Pressure</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          {note.vitals.bp || '—'}
                        </span>
                      </div>

                      {/* Pulse */}
                      <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-2.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700 mb-0.5">
                          <Activity className="w-3.5 h-3.5 text-blue-500" />
                          <span>Pulse</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          {note.vitals.pulse || '—'}
                        </span>
                      </div>

                      {/* Temp */}
                      <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 mb-0.5">
                          <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                          <span>Temp</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          {note.vitals.temperature || '—'}
                        </span>
                      </div>

                      {/* SpO2 */}
                      <div className="bg-cyan-50/60 border border-cyan-100 rounded-xl p-2.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-700 mb-0.5">
                          <Wind className="w-3.5 h-3.5 text-cyan-500" />
                          <span>SpO2</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 block">
                          {note.vitals.oxygenLevel || '—'}
                        </span>
                      </div>

                      {/* Sugar */}
                      <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-2.5 col-span-2 sm:col-span-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-purple-700 mb-0.5">
                          <Droplet className="w-3.5 h-3.5 text-purple-500" />
                          <span>Blood Sugar</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 block truncate">
                          {note.vitals.sugarLevel || '—'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tasks Performed */}
                  {Array.isArray(note.tasksPerformed) && note.tasksPerformed.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Assistance Provided
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {note.tasksPerformed.map((task, tIndex) => (
                          <span
                            key={tIndex}
                            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-1 rounded-lg font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{task}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observations */}
                  {note.observations && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-slate-800 block text-[11px]">
                        Clinical Remarks:
                      </span>
                      <p className="leading-relaxed italic text-slate-600">
                        "{note.observations}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
