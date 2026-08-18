import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Pages
import LandingPage from '../pages/LandingPage';
import ServicesPage from '../pages/ServicesPage';
import CaregiversPage from '../pages/CaregiversPage';
import PatientsPage from '../pages/PatientsPage';
import BookingsPage from '../pages/BookingsPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import CaregiverPendingPage from '../pages/CaregiverPendingPage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServicesPage />} />
        <Route path="/caregivers" element={<CaregiversPage />} />
        <Route path="/caregivers/:id" element={<CaregiversPage />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/caregiver/verification-pending" element={<CaregiverPendingPage />} />

        {/* Protected Dashboard & Patient Management (Family User Role) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <PatientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/new"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <PatientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <PatientsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Protected Booking & Care Shift Routes */}
        <Route
          path="/booking/new"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute allowedRoles={['user', 'caregiver']}>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:id"
          element={
            <ProtectedRoute allowedRoles={['user', 'caregiver']}>
              <BookingsPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
