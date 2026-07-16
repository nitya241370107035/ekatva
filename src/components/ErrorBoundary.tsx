import React, { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-loom-parchment p-4">
          <div className="bg-white rounded-2xl border-2 border-loom-sand p-8 max-w-md w-full shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-loom-error bg-opacity-10 mx-auto mb-4">
              <AlertTriangle size={24} className="text-loom-error" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-loom-ink text-center mb-2">
              कुछ गलत हुआ (Something Went Wrong)
            </h2>
            <p className="text-center text-loom-ink text-opacity-60 mb-6">
              हमें खेद है, लेकिन कोई समस्या आई है। कृपया पृष्ठ को रीफ्रेश करने का प्रयास करें।
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-loom-error bg-opacity-5 border border-loom-error border-opacity-20 rounded-lg p-4 mb-6">
                <p className="text-xs text-loom-error font-mono">
                  {this.state.error?.message}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-loom-wood text-loom-cream rounded-lg font-semibold hover:bg-[#A0522D] transition-colors"
            >
              पृष्ठ रीफ्रेश करें (Refresh Page)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
