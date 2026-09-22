import React, { useState } from 'react';
import { toast } from 'sonner';
import axiosClient from '../../api/axiosClient';
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Droplet,
  CheckSquare,
  FileText,
  X,
  Loader2,
  Stethoscope,
} from 'lucide-react';

const COMMON_TASKS = [
  'Administered scheduled medication',
  'Monitored & recorded resting vital signs',
  'Assisted with physical therapy & mobility exercises',
  'Assisted with bathing, grooming & hygiene care',
  'Assisted with meal intake and oral hydration',
  'Dressing change / skin integrity inspection',
];

export default function CareNoteForm({ bookingId, isOpen, onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vitals, setVitals] = useState({
    bp: '120/80 mmHg',
    pulse: '72 bpm',
    temperature: '98.6 °F',
    sugarLevel: '110 mg/dL',
    oxygenLevel: '98%',
  });

  const [selectedTasks, setSelectedTasks] = useState([
    'Monitored & recorded resting vital signs',
    'Administered scheduled medication',
  ]);

  const [observations, setObservations] = useState('');

  if (!isOpen) return null;

  const handleVitalChange = (field, value) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTask = (task) => {
    setSelectedTasks((prev) =>
      prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookingId) {
      toast.error('Booking reference missing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosClient.post('/care-notes', {
        bookingId,
        vitals,
        tasksPerformed: selectedTasks,
        observations: observations.trim(),
      });

      if (response.data?.status === 'success') {
        toast.success('Shift care note & vitals logged successfully!');
        if (onSuccess) onSuccess(response.data.data);
        onClose();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to log care note. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Log Shift Care Note & Vitals
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Record clinical vitals and completed care assistance for Booking #{bookingId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Clinical Vitals */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Elderly Patient Vital Signs</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Blood Pressure */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  <span>Blood Pressure</span>
                </label>
                <input
                  type="text"
                  value={vitals.bp}
                  onChange={(e) => handleVitalChange('bp', e.target.value)}
                  placeholder="e.g. 120/80 mmHg"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-teal-600"
                />
              </div>

              {/* Pulse / Heart Rate */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                  <span>Pulse / Heart Rate</span>
                </label>
                <input
                  type="text"
                  value={vitals.pulse}
                  onChange={(e) => handleVitalChange('pulse', e.target.value)}
                  placeholder="e.g. 72 bpm"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-teal-600"
                />
              </div>

              {/* Temperature */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  <span>Body Temperature</span>
                </label>
                <input
                  type="text"
                  value={vitals.temperature}
                  onChange={(e) => handleVitalChange('temperature', e.target.value)}
                  placeholder="e.g. 98.6 °F"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-teal-600"
                />
              </div>

              {/* Oxygen Level (SpO2) */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Oxygen (SpO2)</span>
                </label>
                <input
                  type="text"
                  value={vitals.oxygenLevel}
                  onChange={(e) => handleVitalChange('oxygenLevel', e.target.value)}
                  placeholder="e.g. 98%"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-teal-600"
                />
              </div>

              {/* Blood Sugar */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 sm:col-span-2 md:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                  <Droplet className="w-3.5 h-3.5 text-purple-500" />
                  <span>Blood Sugar Level (Random / Fasting)</span>
                </label>
                <input
                  type="text"
                  value={vitals.sugarLevel}
                  onChange={(e) => handleVitalChange('sugarLevel', e.target.value)}
                  placeholder="e.g. 110 mg/dL"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Tasks Performed */}
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-teal-600" />
              <span>Assistance & Nursing Tasks Performed</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_TASKS.map((task) => {
                const isSelected = selectedTasks.includes(task);
                return (
                  <button
                    key={task}
                    type="button"
                    onClick={() => toggleTask(task)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 border-teal-600 text-teal-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-teal-700 focus:ring-teal-600 mt-0.5"
                    />
                    <span>{task}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Clinical Observations */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Caregiver Clinical Remarks & Observations</span>
            </label>
            <textarea
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Record patient mood, appetite, mobility responses, symptoms, or recommendations for family..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-teal-600 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-outline px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Care Note...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Log Note & Broadcast</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
