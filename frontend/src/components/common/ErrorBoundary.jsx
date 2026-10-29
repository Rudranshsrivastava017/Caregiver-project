import React from 'react';
import { AlertTriangle, RotateCcw, Home, PhoneCall, ShieldCheck } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 text-slate-900"
        >
          <div className="max-w-xl w-full bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-10 shadow-lg text-center space-y-6">
            {/* Warning Icon Badge */}
            <div className="w-18 h-18 rounded-2xl bg-amber-50 text-amber-700 border-2 border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-9 h-9" />
            </div>

            {/* Accessible Header & Reassurance */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                We Encountered an Unexpected Issue
              </h1>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Don't worry — your profile, registered elderly family members, and scheduled care shifts remain <strong>completely safe</strong>.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-primary w-full sm:w-auto py-3.5 px-6 flex items-center justify-center gap-2 text-base font-bold shadow-md cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn-outline w-full sm:w-auto py-3.5 px-6 flex items-center justify-center gap-2 text-base font-bold cursor-pointer"
              >
                <Home className="w-5 h-5 text-slate-700" />
                <span>Return to Home</span>
              </button>
            </div>

            {/* Emergency & Support Assistance */}
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-xs sm:text-sm text-teal-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0" />
                <span>Need immediate senior healthcare support?</span>
              </div>
              <a
                href="tel:18001234567"
                className="font-extrabold text-teal-800 hover:text-teal-950 underline flex items-center gap-1.5 shrink-0"
              >
                <PhoneCall className="w-4 h-4 text-amber-600" />
                <span>1800-123-4567</span>
              </a>
            </div>

            {/* Collapsible Technical Details for Diagnostics */}
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details className="text-left text-xs text-slate-500 bg-slate-100 rounded-xl p-3 border border-slate-200">
                <summary className="font-semibold cursor-pointer text-slate-700 hover:underline">
                  Technical Diagnostics (Developer Info)
                </summary>
                <div className="mt-2 font-mono whitespace-pre-wrap break-all text-[11px] text-red-800 bg-white p-2 rounded border border-slate-200 overflow-x-auto max-h-48">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
