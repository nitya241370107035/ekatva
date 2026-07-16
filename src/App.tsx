import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { RegisterProfile } from './pages/RegisterProfile';
import { WeaverDashboard } from './pages/weaver/Dashboard';
import { WeaverGrievanceDetailPage } from './pages/weaver/GrievanceDetail';
import { WeaverSchemes } from './pages/weaver/WeaverSchemes';
import { SecretaryDashboard } from './pages/secretary/Dashboard';
import { SecretaryMembers } from './pages/secretary/Members';
import { SecretarySchemes } from './pages/secretary/SecretarySchemes';
import { CertificationsSettings } from './pages/secretary/CertificationsSettings';
import { WeaverProfilePage } from './pages/secretary/WeaverProfile';
import { NoticeBoardPage } from './pages/secretary/NoticeBoard';
import { MeetingsPage } from './pages/secretary/Meetings';
import { GrievanceListPage } from './pages/secretary/GrievanceList';
import { GrievanceDetailPage } from './pages/secretary/GrievanceDetail';
import { ProductionBoard } from './pages/secretary/ProductionBoard';
import { CreateJobCard } from './pages/secretary/CreateJobCard';
import { JobCardDetail } from './pages/secretary/JobCardDetail';
import { StockManagement } from './pages/secretary/StockManagement';
import { IndentRequestsPage } from './pages/secretary/IndentRequestsPage';
import { VendorListPage } from './pages/secretary/VendorListPage';
import { ProcurementAdvisorPage } from './pages/secretary/ProcurementAdvisorPage';
import { CooperativeProducts } from './pages/secretary/CooperativeProducts';
import { RFQOpportunities } from './pages/secretary/RFQOpportunities';
import { BuyerDashboard } from './pages/buyer/Dashboard';
import { Marketplace } from './pages/buyer/Marketplace';
import { MyRFQs } from './pages/buyer/MyRFQs';
import { TracePage } from './pages/public/TracePage';
import { WeavingLoader } from './components/ui/WeavingLoader';
import { useTranslation } from 'react-i18next';

// Custom component to handle role-based redirection from home route
const RoleRedirect: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-loom-parchment flex flex-col items-center justify-center gap-4">
        <WeavingLoader text={t('common.loading', 'एकत्व लोड हो रहा है...')} />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userProfile) {
    if (userProfile.role === 'weaver') return <Navigate to="/weaver" replace />;
    if (userProfile.role === 'secretary') return <Navigate to="/secretary" replace />;
    if (userProfile.role === 'buyer') return <Navigate to="/buyer" replace />;
  }

  return <Navigate to="/register-profile" replace />;
};

export default function App() {
  const { t } = useTranslation();
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-profile" element={<RegisterProfile />} />
          <Route path="/trace/:instanceId" element={<TracePage />} />

          {/* Weaver Protected Route */}
          <Route 
            path="/weaver" 
            element={
              <ProtectedRoute allowedRoles={['weaver']}>
                <WeaverDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/weaver/grievances/:id" 
            element={
              <ProtectedRoute allowedRoles={['weaver']}>
                <WeaverGrievanceDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/weaver/schemes" 
            element={
              <ProtectedRoute allowedRoles={['weaver']}>
                <WeaverSchemes />
              </ProtectedRoute>
            } 
          />

          {/* Secretary Protected Routes */}
          <Route 
            path="/secretary" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <SecretaryDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/members" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <SecretaryMembers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/members/:id" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <WeaverProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/notices" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <NoticeBoardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/meetings" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <MeetingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/grievances" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <GrievanceListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/grievances/:id" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <GrievanceDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/production" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <ProductionBoard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/production/new" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <CreateJobCard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/production/:jobCardId" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <JobCardDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/stock" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <StockManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/indent-requests" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <IndentRequestsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/vendors" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <VendorListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/procurement-advisor" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <ProcurementAdvisorPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/products" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <CooperativeProducts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/rfq-opportunities" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <RFQOpportunities />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/schemes" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <SecretarySchemes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/secretary/certifications" 
            element={
              <ProtectedRoute allowedRoles={['secretary']}>
                <CertificationsSettings />
              </ProtectedRoute>
            } 
          />

          {/* Buyer Protected Routes */}
          <Route 
            path="/buyer" 
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <Marketplace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/buyer/marketplace" 
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <Marketplace />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/buyer/rfqs" 
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <MyRFQs />
              </ProtectedRoute>
            } 
          />

          {/* Root Path - Redirection */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Simple 404 / Unauthorized Fallback page */}
          <Route 
            path="/unauthorized" 
            element={
              <div className="min-h-screen bg-loom-parchment flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md p-8 vintage-card">
                  <span className="text-6xl text-loom-error block mb-4">⚠️</span>
                  <h1 className="font-heading text-3xl font-bold text-loom-error mb-2">
                    {t('common.unauthorized', 'अनधिकृत पहुँच')}
                  </h1>
                  <p className="font-body text-lg text-loom-ink mb-6">
                    {t('common.unauthorizedDesc', 'आपके पास इस अनुभाग तक पहुँचने की अनुमति नहीं है।')}
                  </p>
                  <Link to="/" className="vintage-button px-6 py-2.5 inline-block">
                    {t('common.backToSafety', 'मुख्य पृष्ठ पर जाएं (Back to Safety)')}
                  </Link>
                </div>
              </div>
            } 
          />

          {/* Catch All Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
