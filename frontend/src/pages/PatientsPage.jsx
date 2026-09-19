import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../api/axiosClient';
import PatientCard from '../components/patients/PatientCard';
import {
  Plus,
  Users,
  Search,
  Loader2,
  AlertCircle,
  Trash2,
  X,
  HeartPulse,
} from 'lucide-react';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPatients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/patients');
      if (response.data?.status === 'success') {
        setPatients(response.data.data || []);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to load patient profiles.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      const id = patientToDelete.patientId || patientToDelete._id;
      await axiosClient.delete(`/patients/${id}`);
      toast.success(
        `Profile for ${patientToDelete.fullName} removed successfully.`
      );
      setPatients((prev) =>
        prev.filter((p) => (p.patientId || p._id) !== id)
      );
      setPatientToDelete(null);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to delete patient profile.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter patients by search query
  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.fullName?.toLowerCase().includes(q) ||
      p.medicalHistory?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.emergencyContactName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 py-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-800 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-teal-200">
            <Users className="w-3.5 h-3.5 text-teal-700" />
            <span>Family Care Management</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Elderly Patient Profiles
          </h1>
          <p className="text-slate-600 text-lg mt-1">
            Manage profiles, health records, and mobility needs for senior family members.
          </p>
        </div>

        <Link
          to="/patients/new"
          className="btn-primary flex items-center gap-2 px-5 py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Patient Profile</span>
        </Link>
      </div>

      {/* Search Bar & Count Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, condition, or address..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-semibold self-end sm:self-center">
          Showing{' '}
          <span className="text-slate-900 font-bold">
            {filteredPatients.length}
          </span>{' '}
          of{' '}
          <span className="text-slate-900 font-bold">{patients.length}</span>{' '}
          patient profiles
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
              <div className="h-8 bg-slate-100 rounded-full w-1/3" />
              <div className="h-20 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-base font-bold text-red-900">
            Failed to load patient profiles
          </h3>
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchPatients}
            className="btn-outline text-xs px-4 py-2 text-red-700 hover:bg-red-100 cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State: No Patients Registered Yet */}
      {!isLoading && !error && patients.length === 0 && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-100">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">
              No Patient Profiles Registered
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              You have not registered any elderly family members yet. Create your first profile to easily schedule in-home nursing, physiotherapy, or attendant shifts.
            </p>
          </div>
          <Link
            to="/patients/new"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Patient</span>
          </Link>
        </div>
      )}

      {/* Empty State: Search Query Yields 0 Results */}
      {!isLoading && !error && patients.length > 0 && filteredPatients.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <p className="text-slate-700 font-semibold text-base">
            No patient profiles match "{searchQuery}"
          </p>
          <p className="text-xs text-slate-500">
            Try searching for a different name, condition, or address.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="btn-outline text-xs px-4 py-2 cursor-pointer mt-2"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Patient Cards Grid */}
      {!isLoading && !error && filteredPatients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.patientId || patient._id}
              patient={patient}
              onDelete={(p) => setPatientToDelete(p)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                Remove Patient Profile?
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Are you sure you want to remove{' '}
                <strong className="text-slate-900">
                  {patientToDelete.fullName}
                </strong>
                ? This will permanently delete their health history and emergency contacts from your account.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                disabled={isDeleting}
                className="btn-outline px-4 py-2.5 text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Delete Profile</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
