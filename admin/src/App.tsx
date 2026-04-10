import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import OrganizationsPage from './pages/OrganizationsPage';
import MapPage from './pages/MapPage';
import BookingsPage from './pages/BookingsPage';
import QuotesPage from './pages/QuotesPage';
import PaymentsPage from './pages/PaymentsPage';
import DisputesPage from './pages/DisputesPage';
import ReviewsPage from './pages/ReviewsPage';
import SettingsPage from './pages/SettingsPage';
import ProviderInboxPage from './pages/ProviderInboxPage';
import CustomersPage from './pages/CustomersPage';
import ServicesPage from './pages/ServicesPage';
import LiveMonitorPage from './pages/LiveMonitorPage';
import ProvidersPage from './pages/ProvidersPage';
import ProviderDetailPage from './pages/ProviderDetailPage';
import GeoOpsPage from './pages/GeoOpsPage';
import MarketControlPage from './pages/MarketControlPage';
import AuditLogPage from './pages/AuditLogPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import FeatureFlagsPage from './pages/FeatureFlagsPage';
import SuggestionsPage from './pages/SuggestionsPage';
import ReputationPage from './pages/ReputationPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, token } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="live-monitor" element={<LiveMonitorPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="providers" element={<ProvidersPage />} />
        <Route path="providers/:id" element={<ProviderDetailPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="geo-ops" element={<GeoOpsPage />} />
        <Route path="market-control" element={<MarketControlPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="disputes" element={<DisputesPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="provider-inbox" element={<ProviderInboxPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit-log" element={<AuditLogPage />} />
        <Route path="feature-flags" element={<FeatureFlagsPage />} />
        <Route path="suggestions" element={<SuggestionsPage />} />
        <Route path="providers/:providerId/reputation" element={<ReputationPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
