import React from 'react';
import { useAccessibility, FONT_SCALES } from '../../context/AccessibilityContext';
import { Contrast, ZoomIn } from 'lucide-react';

export default function AccessibilityToolbar({ className = '' }) {
  const { fontScale, setFontScale, isHighContrast, toggleHighContrast } = useAccessibility();

  return (
    <div
      role="region"
      aria-label="Senior Citizen Accessibility Controls"
      className={`flex items-center gap-3 text-xs ${className}`}
    >
      {/* Font Scaling Control Group */}
      <div
        role="group"
        aria-label="Text Size Adjustment"
        className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60"
      >
        <span className="sr-only">Adjust Text Size:</span>
        <button
          type="button"
          onClick={() => setFontScale('normal')}
          aria-pressed={fontScale === 'normal'}
          aria-label="Set text size to normal 100 percent"
          title="Normal Text Size (100%)"
          className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
            fontScale === 'normal'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          A
        </button>

        <button
          type="button"
          onClick={() => setFontScale('large')}
          aria-pressed={fontScale === 'large'}
          aria-label="Set text size to large 115 percent"
          title="Large Text Size (115%)"
          className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
            fontScale === 'large'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          A<span className="text-[10px]">+</span>
        </button>

        <button
          type="button"
          onClick={() => setFontScale('xlarge')}
          aria-pressed={fontScale === 'xlarge'}
          aria-label="Set text size to extra large 130 percent"
          title="Extra Large Text Size (130%)"
          className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
            fontScale === 'xlarge'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          A<span className="text-[10px]">++</span>
        </button>
      </div>

      {/* High Contrast Toggle Button */}
      <button
        type="button"
        onClick={toggleHighContrast}
        aria-pressed={isHighContrast}
        aria-label={`Toggle high contrast mode, currently ${isHighContrast ? 'enabled' : 'disabled'}`}
        title="Toggle High Contrast Display Mode (WCAG 2.1 AA)"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
          isHighContrast
            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
            : 'bg-slate-800/80 text-slate-200 border-slate-700/60 hover:bg-slate-700/70 hover:text-white'
        }`}
      >
        <Contrast className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Contrast:</span>
        <span className="uppercase text-[11px] font-extrabold">
          {isHighContrast ? 'High' : 'Normal'}
        </span>
      </button>
    </div>
  );
}
