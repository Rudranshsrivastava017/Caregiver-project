import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import ServiceCard from '../components/services/ServiceCard';
import ServiceFilter from '../components/services/ServiceFilter';
import { Stethoscope, Loader2, AlertCircle } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchQuery && searchQuery.trim() !== '') {
        params.search = searchQuery.trim();
      }

      const response = await axiosClient.get('/services', { params });
      if (response.data?.status === 'success') {
        setServices(response.data.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load healthcare services.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly to avoid excessive calls
    const handler = setTimeout(() => {
      fetchServices();
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [selectedCategory, searchQuery]);

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-800 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-teal-200">
          <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
          <span>Professional In-Home Care Directory</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Elderly Healthcare & Nursing Services
        </h1>
        <p className="text-slate-600 text-lg mt-2">
          Explore specialized medical and daily living assistance services delivered safely in your home by verified healthcare staff.
        </p>
      </div>

      {/* Filter Component */}
      <ServiceFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClear={handleClearFilters}
      />

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-slate-200" />
                <div className="w-20 h-6 rounded-full bg-slate-200" />
              </div>
              <div className="h-6 bg-slate-200 rounded w-2/3" />
              <div className="h-16 bg-slate-100 rounded" />
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="flex justify-between pt-4 border-t border-slate-100">
                <div className="w-24 h-8 bg-slate-200 rounded" />
                <div className="w-28 h-8 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error View */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-base font-bold text-red-900">
            Could not fetch service catalog
          </h3>
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchServices}
            className="btn-outline text-xs px-4 py-2 text-red-700 hover:bg-red-100 cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && services.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            No Services Found
          </h3>
          <p className="text-slate-600 text-sm">
            We couldn't find any healthcare services matching your filter criteria. Try searching for a different keyword or reset filters.
          </p>
          <button
            onClick={handleClearFilters}
            className="btn-primary inline-block px-5 py-2.5 text-sm cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Services Grid */}
      {!isLoading && !error && services.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service) => (
            <ServiceCard key={service.serviceId || service._id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
