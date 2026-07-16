import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('weaver' | 'secretary' | 'buyer')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-loom-parchment flex flex-col items-center justify-center gap-6 p-4">
        {/* Animated Vintage Spinning Wheel Spinner */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg 
            width="80" 
            height="80" 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-loom-wood animate-spin-slow"
          >
            <circle cx="50" cy="50" r="40" stroke="#8B4513" strokeWidth="3" strokeDasharray="6 6" />
            <circle cx="50" cy="50" r="28" stroke="#C8A45C" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="4" fill="#8B4513" />
            <line x1="50" y1="10" x2="50" y2="90" stroke="#8B4513" strokeWidth="2" />
            <line x1="10" y1="50" x2="90" y2="50" stroke="#8B4513" strokeWidth="2" />
            <line x1="22" y1="22" x2="78" y2="78" stroke="#C8A45C" strokeWidth="1.5" />
            <line x1="78" y1="22" x2="22" y2="78" stroke="#C8A45C" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-loom-wood">एकत्व</h2>
          <p className="font-body text-lg text-loom-ink-light mt-1 animate-pulse">
            लोड हो रहा है... (Loading...)
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    return (
      <div className="min-h-screen bg-loom-parchment flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 vintage-card">
          <span className="text-6xl text-loom-error block mb-4">⚠️</span>
          <h1 className="font-heading text-3xl font-bold text-loom-error mb-2">
            अनधिकृत पहुँच
          </h1>
          <p className="font-body text-lg text-loom-ink mb-6">
            आपको इस पृष्ठ को देखने की अनुमति नहीं है।
            <br />
            (Unauthorized access. You do not have permission to view this page.)
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
