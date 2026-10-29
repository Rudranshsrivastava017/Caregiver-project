import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true
  );
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredNotice(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        setShowRestoredNotice(true);
        setTimeout(() => setShowRestoredNotice(false), 3000);
      }
    }
  };

  if (isOnline && !showRestoredNotice) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full py-2.5 px-4 text-xs sm:text-sm font-semibold transition-all duration-300 shadow-md ${
        !isOnline
          ? 'bg-rose-900 text-rose-50 border-b border-rose-800'
          : 'bg-emerald-800 text-emerald-50 border-b border-emerald-700'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          {!isOnline ? (
            <WifiOff className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
          ) : (
            <Wifi className="w-4 h-4 text-emerald-300 shrink-0" />
          )}

          <span>
            {!isOnline ? (
              <>
                <strong>Offline Notice:</strong> You are currently disconnected from the internet. Cached views are accessible, but shift bookings and real-time updates require an active connection.
              </>
            ) : (
              <>
                <strong>Connection Restored:</strong> You are back online. Real-time care alerts and scheduling are active.
              </>
            )}
          </span>
        </div>

        {!isOnline && (
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-md text-xs font-bold border border-rose-600 cursor-pointer transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Connection</span>
          </button>
        )}
      </div>
    </div>
  );
}
