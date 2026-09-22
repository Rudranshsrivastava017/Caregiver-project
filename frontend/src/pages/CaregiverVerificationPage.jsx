import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../api/axiosClient';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  Search,
  RefreshCw,
  AlertCircle,
  UserCheck,
  Stethoscope,
  Building,
  Award,
  ArrowLeft,
  X,
} from 'lucide-react';

export default function CaregiverVerificationPage() {
  const [pendingCaregivers, setPendingCaregivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Inspection modal state
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchPendingQueue = async () => {
    setIsRefreshing(true);
    try {
      const response = await axiosClient.get('/admin/caregivers/pending');
      if (response.data?.status === 'success') {
        setPendingCaregivers(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load pending verifications:', err);
      toast.error(err.response?.data?.message || 'Failed to load pending caregiver queue.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingQueue();
  }, []);

  const handleDecision = async (decision) => {
    if (!selectedCaregiver) return;

    if (decision === 'rejected' && !rejectReason.trim()) {
      toast.error('Please specify a rejection or feedback reason for the caregiver.');
      return;
    }

    setDecisionLoading(true);
    try {
      const caregiverUserId = selectedCaregiver.user?.userId || selectedCaregiver.caregiverProfile?.caregiverId;
      const payload = {
        decision,
        reason: decision === 'rejected' ? rejectReason.trim() : null,
      };

      const response = await axiosClient.patch(`/admin/caregivers/${caregiverUserId}/verify`, payload);

      if (response.data?.status === 'success') {
        toast.success(
          decision === 'approved'
            ? `Credentials approved for ${selectedCaregiver.user?.fullName}. Profile activated in directory!`
            : `Application rejected for ${selectedCaregiver.user?.fullName}.`
        );
        setSelectedCaregiver(null);
        setRejectReason('');
        setShowRejectInput(false);
        fetchPendingQueue();
      }
    } catch (err) {
      console.error('Verification decision error:', err);
      toast.error(err.response?.data?.message || 'Failed to process verification decision.');
    } finally {
      setDecisionLoading(false);
    }
  };

  const filteredList = pendingCaregivers.filter((item) => {
    const name = item.user?.fullName?.toLowerCase() || '';
    const email = item.user?.email?.toLowerCase() || '';
    const spec = item.caregiverProfile?.specialization?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q) || spec.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Dashboard</span>
          </Link>
          <div className="flex items-center gap-2 text-teal-700 font-bold text-sm uppercase tracking-wider">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>Credential Verification Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Caregiver Identity & License Review
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Review legal government IDs, nursing certificates, and clinical qualifications before activating public profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPendingQueue}
            disabled={isRefreshing}
            className="btn-outline flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
          />
        </div>
        <div className="text-xs font-bold text-slate-600">
          Pending Verifications: <span className="text-teal-700 font-extrabold">{filteredList.length}</span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">All Applications Reviewed!</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            There are currently no caregiver applications awaiting administrator review. All active healthcare professionals are verified.
          </p>
          <Link to="/admin" className="btn-outline inline-flex items-center gap-2 mt-2 text-sm">
            <span>Return to Dashboard</span>
          </Link>
        </div>
      ) : (
        /* Pending Applications Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredList.map((item) => {
            const user = item.user || {};
            const cg = item.caregiverProfile || {};

            return (
              <div
                key={user.userId || cg.caregiverId}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top row: Avatar & Status Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          user.profilePhotoUrl ||
                          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
                        }
                        alt={user.fullName}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200"
                      />
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                          {user.fullName}
                        </h3>
                        <span className="text-xs text-slate-500 font-medium">{user.email}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold uppercase tracking-wide bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md border border-teal-200">
                            {cg.specialization || user.role}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {cg.yearsExperience ? `${cg.yearsExperience} yrs exp` : 'New Applicant'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                      Pending ID
                    </span>
                  </div>

                  {/* Document & Credential Tags */}
                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
                    <div>
                      <span className="text-slate-500 block">Govt Legal ID:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {user.legalIdNumber || 'Provided in documents'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Qualification:</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {cg.qualification || 'Certified Healthcare Worker'}
                      </span>
                    </div>
                  </div>

                  {/* Certification Docs count */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>
                      {cg.certificationDocsUrl?.length || 1} Document(s) attached for inspection
                    </span>
                  </div>
                </div>

                {/* Inspect Action Button */}
                <button
                  onClick={() => {
                    setSelectedCaregiver(item);
                    setShowRejectInput(false);
                    setRejectReason('');
                  }}
                  className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Inspect Credentials & Review</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Credentials Inspection Modal */}
      {selectedCaregiver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Review Caregiver Credentials
                  </h3>
                  <p className="text-xs text-slate-500">
                    Applicant ID: {selectedCaregiver.user?.userId || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCaregiver(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Caregiver Summary Info */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <img
                src={
                  selectedCaregiver.user?.profilePhotoUrl ||
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
                }
                alt={selectedCaregiver.user?.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-600"
              />
              <div className="space-y-0.5">
                <h4 className="text-lg font-bold text-slate-900">
                  {selectedCaregiver.user?.fullName}
                </h4>
                <p className="text-xs text-slate-600">
                  {selectedCaregiver.user?.email} • {selectedCaregiver.user?.phone || 'No phone'}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-bold bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded-md">
                    {selectedCaregiver.caregiverProfile?.specialization || 'nurse'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {selectedCaregiver.caregiverProfile?.yearsExperience || 0} Years Experience
                  </span>
                </div>
              </div>
            </div>

            {/* Clinical Qualifications & Legal ID */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Identity & Education Records
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-xs text-slate-500 block">Declared Legal ID Number</span>
                  <span className="font-mono font-bold text-slate-900 text-base">
                    {selectedCaregiver.user?.legalIdNumber || 'PAN-XXXX-DEMO'}
                  </span>
                  <span className="text-[11px] text-amber-700 block mt-0.5">
                    Unverified — Pending Approval
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-xs text-slate-500 block">Degree / Certification</span>
                  <span className="font-bold text-slate-900 text-base block truncate">
                    {selectedCaregiver.caregiverProfile?.qualification || 'Certified Professional'}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Service Areas: {selectedCaregiver.caregiverProfile?.serviceAreas?.join(', ') || 'Delhi NCR'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submitted Certification Documents Previews */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Submitted License Documents & Certificates
              </h5>
              <div className="space-y-2">
                {(
                  selectedCaregiver.caregiverProfile?.certificationDocsUrl?.length
                    ? selectedCaregiver.caregiverProfile.certificationDocsUrl
                    : [
                        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
                      ]
                ).map((docUrl, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-teal-300 transition-colors bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-800 block">
                          Credential Document #{idx + 1}
                        </span>
                        <span className="text-xs text-slate-500">
                          Nursing License & State Medical Council Registration
                        </span>
                      </div>
                    </div>
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 bg-teal-50 px-3 py-1.5 rounded-lg"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Rejection Feedback Box (Conditional) */}
            {showRejectInput && (
              <div className="space-y-2 p-4 bg-rose-50 rounded-2xl border border-rose-200 animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-rose-900 uppercase">
                  Rejection Reason / Required Remediation:
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. State Nursing Council registration certificate is expired. Please upload a clear photo of current license renewal."
                  className="w-full p-3 rounded-xl border border-rose-300 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white"
                />
                <p className="text-[11px] text-rose-700">
                  This explanation will be recorded in the caregiver's administrative file.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              {!showRejectInput ? (
                <button
                  type="button"
                  onClick={() => setShowRejectInput(true)}
                  className="btn-outline text-rose-700 border-rose-200 hover:bg-rose-50 w-full sm:w-auto text-sm px-4 py-2.5"
                >
                  <XCircle className="w-4 h-4 mr-1.5 inline" />
                  <span>Reject Application</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={decisionLoading}
                  onClick={() => handleDecision('rejected')}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm w-full sm:w-auto transition-colors"
                >
                  {decisionLoading ? 'Submitting Rejection...' : 'Confirm Rejection'}
                </button>
              )}

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCaregiver(null);
                    setShowRejectInput(false);
                  }}
                  className="btn-outline text-sm px-4 py-2.5 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={decisionLoading}
                  onClick={() => handleDecision('approved')}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 w-full sm:w-auto transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{decisionLoading ? 'Approving...' : 'Approve & Activate'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
