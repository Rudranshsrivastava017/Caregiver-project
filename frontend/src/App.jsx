import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import OfflineBanner from './components/layout/OfflineBanner';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <OfflineBanner />
              <Toaster position="top-right" richColors closeButton />
              <AppRoutes />
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}
