import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import axiosClient from '../api/axiosClient';
import PatientForm from '../components/patients/PatientForm';
import { ArrowLeft, Loader2, HeartPulse, UserPlus } from 'lucide-react';

export default function PatientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    const fetchPatient = async () => {
      try {
        const response = await axiosClient.get(`/patients/${id}`);
        if (response.data?.status === 'success' && isMounted) {
          setInitialData(response.data.data);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(
            error.response?.data?.message || 'Failed to load patient details.'
          );
          navigate('/patients');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPatient();

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, navigate]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        const response = await axiosClient.patch(`/patients/${id}`, formData);
        toast.success(
          response.data?.message || 'Patient profile updated successfully.'
        );
      } else {
        const response = await axiosClient.post('/patients', formData);
        toast.success(
          response.data?.message || 'Patient profile created successfully.'
        );
      }
      navigate('/patients');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not save patient profile. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-teal-700 animate-spin" />
        <p className="text-slate-600 font-semibold text-sm">
          Loading patient profile information...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link
            to="/patients"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Patient List</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            {isEditMode ? (
              <>
                <HeartPulse className="w-8 h-8 text-teal-700" />
                <span>Edit Patient: {initialData?.fullName}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-8 h-8 text-teal-700" />
                <span>Register New Elderly Family Member</span>
              </>
            )}
          </h1>
          <p className="text-slate-600 text-base mt-1">
            {isEditMode
              ? 'Update mobility condition, medical needs, or emergency contacts.'
              : 'Add an elderly family member to request home nursing and caregiving services.'}
          </p>
        </div>
      </div>

      {/* Patient Form */}
      <PatientForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => navigate('/patients')}
      />
    </div>
  );
}
