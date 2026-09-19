import React from 'react';
import { Search, X, Sparkles, Stethoscope, Activity, HeartHandshake } from 'lucide-react';

export default function ServiceFilter({
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onClear,
}) {
  const CATEGORIES = [
    { id: 'all', label: 'All Services', icon: Sparkles },
    { id: 'medical', label: 'Medical Nursing', icon: Stethoscope },
    { id: 'rehabilitation', label: 'Physiotherapy & Rehab', icon: Activity },
    { id: 'non_medical', label: 'Attendant & Companionship', icon: HeartHandshake },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      {/* Top row: Search input & Category Quick Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search care services (e.g. ICU nurse, stroke rehab, dementia)..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-slate-900"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Clear Filters Button */}
        {(selectedCategory !== 'all' || searchQuery) && (
          <button
            onClick={onClear}
            className="btn-outline text-xs px-3.5 py-2.5 text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 self-end md:self-auto cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
