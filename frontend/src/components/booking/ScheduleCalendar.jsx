import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  Loader2,
  Sparkles,
} from 'lucide-react';

const STANDARD_SLOTS = [
  {
    id: 'morning',
    time: 'Morning (08:00 AM - 12:00 PM)',
    duration: '4 Hours',
    period: 'Morning',
  },
  {
    id: 'afternoon',
    time: 'Afternoon (12:00 PM - 04:00 PM)',
    duration: '4 Hours',
    period: 'Afternoon',
  },
  {
    id: 'evening',
    time: 'Evening (04:00 PM - 08:00 PM)',
    duration: '4 Hours',
    period: 'Evening',
  },
  {
    id: 'day_shift',
    time: 'Day Shift (08:00 AM - 08:00 PM)',
    duration: '12 Hours',
    period: 'Full Day',
  },
  {
    id: 'night_shift',
    time: 'Night (08:00 PM - 08:00 AM)',
    duration: '12 Hours',
    period: 'Overnight',
  },
  {
    id: '24hr_shift',
    time: '24 Hours (Live-in)',
    duration: '24 Hours',
    period: 'Live-in',
  },
];

export default function ScheduleCalendar({
  caregiver,
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  duration,
  onDurationChange,
}) {
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);

  // Minimum selectable date: today in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Maximum date: 30 days from now
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  // Fetch already booked slots whenever caregiver or date changes
  useEffect(() => {
    if (!caregiver?.caregiverId || !selectedDate) return;

    let isMounted = true;
    const fetchAvailability = async () => {
      setIsCheckingAvailability(true);
      setAvailabilityError(null);
      try {
        const response = await axiosClient.get('/bookings/availability', {
          params: {
            caregiverId: caregiver.caregiverId,
            date: selectedDate,
          },
        });

        if (response.data?.status === 'success' && isMounted) {
          setBookedSlots(response.data.bookedSlots || []);
        }
      } catch (err) {
        if (isMounted) {
          setAvailabilityError('Could not verify real-time caregiver schedule.');
        }
      } finally {
        if (isMounted) {
          setIsCheckingAvailability(false);
        }
      }
    };

    fetchAvailability();

    return () => {
      isMounted = false;
    };
  }, [caregiver?.caregiverId, selectedDate]);

  // Check if a slot overlaps with any already-booked slot
  const isSlotBooked = (slotTime) => {
    return bookedSlots.some((b) => {
      if (b.scheduledTime === slotTime) return true;
      if (b.scheduledTime.includes('24 Hour') || slotTime.includes('24 Hour')) return true;
      if (b.scheduledTime.includes('Day Shift')) {
        return (
          slotTime.includes('Morning') ||
          slotTime.includes('Afternoon') ||
          slotTime.includes('Evening')
        );
      }
      if (slotTime.includes('Day Shift')) {
        return (
          b.scheduledTime.includes('Morning') ||
          b.scheduledTime.includes('Afternoon') ||
          b.scheduledTime.includes('Evening')
        );
      }
      return false;
    });
  };

  const handleSlotSelect = (slot) => {
    if (isSlotBooked(slot.time)) return;
    onTimeChange(slot.time);
    if (onDurationChange) {
      onDurationChange(slot.duration);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Date Picker */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <CalendarIcon className="w-5 h-5 text-teal-600" />
          <span>1. Select Scheduled Shift Date</span>
        </div>

        <div className="max-w-xs">
          <input
            type="date"
            min={todayStr}
            max={maxDateStr}
            value={selectedDate}
            onChange={(e) => {
              onDateChange(e.target.value);
              // reset time slot when date changes
              onTimeChange('');
            }}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 text-base font-semibold bg-white text-slate-900 cursor-pointer"
          />
          <span className="text-xs text-slate-500 mt-1 block">
            Booking available for the next 30 days.
          </span>
        </div>
      </div>

      {/* 2. Real-Time Shift Time Slots */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Clock className="w-5 h-5 text-teal-600" />
            <span>2. Select Shift Time Slot</span>
          </div>

          {isCheckingAvailability ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-teal-700 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Checking schedule conflicts...</span>
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              {bookedSlots.length > 0 ? (
                <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {bookedSlots.length} time slot(s) already booked on this date
                </span>
              ) : (
                <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  All time slots available
                </span>
              )}
            </span>
          )}
        </div>

        {availabilityError && (
          <div className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{availabilityError}</span>
          </div>
        )}

        {/* Time Slot Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {STANDARD_SLOTS.map((slot) => {
            const booked = isSlotBooked(slot.time);
            const isSelected = selectedTime === slot.time;

            return (
              <button
                key={slot.id}
                type="button"
                disabled={booked}
                onClick={() => handleSlotSelect(slot)}
                className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                  booked
                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'border-teal-600 bg-teal-50/70 shadow-xs ring-1 ring-teal-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      booked
                        ? 'bg-red-100 text-red-800'
                        : isSelected
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {booked ? 'Already Booked' : slot.period}
                  </span>

                  {booked ? (
                    <Lock className="w-4 h-4 text-slate-400" />
                  ) : isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  ) : null}
                </div>

                <div>
                  <p
                    className={`text-sm font-bold ${
                      booked
                        ? 'text-slate-500 line-through'
                        : isSelected
                        ? 'text-teal-950'
                        : 'text-slate-900'
                    }`}
                  >
                    {slot.time}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Duration: {slot.duration}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {selectedTime && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 text-xs text-teal-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              Selected Shift: <strong>{selectedTime}</strong> ({duration}) on{' '}
              <strong>{selectedDate}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
