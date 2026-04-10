import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/api/admin-panel/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// Admin Dashboard
export const adminAPI = {
  // Dashboard & Metrics
  getDashboard: () => api.get('/admin/dashboard'),
  getMarketMetrics: () => api.get('/admin/metrics/market'),
  getResponseMetrics: () => api.get('/admin/metrics/response'),
  getLiveFeed: (limit?: number) => api.get('/admin/live-feed', { params: { limit: limit || 50 } }),
  getAlerts: () => api.get('/admin/alerts'),
  
  // Users
  getUsers: (params?: { role?: string; search?: string; status?: string; limit?: number; skip?: number }) =>
    api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  getUserActivity: (id: string) => api.get(`/admin/users/${id}/activity`),
  blockUser: (id: string) => api.post(`/admin/users/${id}/block`),
  unblockUser: (id: string) => api.post(`/admin/users/${id}/unblock`),
  addUserNote: (id: string, note: string) => api.post(`/admin/users/${id}/notes`, { note }),
  
  // Organizations / Providers
  getOrganizations: (params?: { status?: string; search?: string; type?: string; verified?: boolean; limit?: number; skip?: number }) =>
    api.get('/admin/organizations', { params }),
  getOrganization: (id: string) => api.get(`/admin/organizations/${id}`),
  getOrgPerformance: (id: string) => api.get(`/admin/organizations/${id}/performance`),
  getOrgBookings: (id: string, params?: { limit?: number; skip?: number }) =>
    api.get(`/admin/organizations/${id}/bookings`, { params }),
  getOrgPayouts: (id: string) => api.get(`/admin/organizations/${id}/payouts`),
  enableOrg: (id: string) => api.post(`/admin/organizations/${id}/enable`),
  disableOrg: (id: string) => api.post(`/admin/organizations/${id}/disable`),
  suspendOrg: (id: string, reason: string) => api.post(`/admin/organizations/${id}/suspend`, { reason }),
  verifyOrg: (id: string) => api.post(`/admin/organizations/${id}/verify`),
  setOrgLocation: (id: string, data: { lat: number; lng: number; address?: string }) =>
    api.patch(`/organizations/${id}/location/admin`, data),
  verifyLocation: (id: string) => api.post(`/organizations/${id}/location/verify`),
  setOrgCommission: (id: string, tier: string) => api.patch(`/admin/organizations/${id}/commission`, { tier }),
  addOrgNote: (id: string, note: string) => api.post(`/admin/organizations/${id}/notes`, { note }),
  setOrgBoost: (id: string, enabled: boolean) => api.post(`/admin/organizations/${id}/boost`, { enabled }),
  
  // Bookings
  getBookings: (params?: { status?: string; providerId?: string; customerId?: string; dateFrom?: string; dateTo?: string; limit?: number; skip?: number }) =>
    api.get('/admin/bookings', { params }),
  getBooking: (id: string) => api.get(`/admin/bookings/${id}`),
  getBookingTimeline: (id: string) => api.get(`/admin/bookings/${id}/timeline`),
  updateBookingStatus: (id: string, status: string, reason?: string) =>
    api.patch(`/admin/bookings/${id}/status`, { status, reason }),
  reassignBooking: (id: string, providerId: string) =>
    api.post(`/admin/bookings/${id}/reassign`, { providerId }),
  refundBooking: (id: string, amount: number, reason: string) =>
    api.post(`/admin/bookings/${id}/refund`, { amount, reason }),
  addBookingNote: (id: string, note: string) => api.post(`/admin/bookings/${id}/notes`, { note }),
  
  // Quotes / Requests
  getQuotes: (params?: { status?: string; urgent?: boolean; noResponse?: boolean; limit?: number; page?: number }) =>
    api.get('/admin/quotes/all', { params }),
  getQuote: (id: string) => api.get(`/admin/quotes/${id}`),
  getQuoteDetails: (id: string) => api.get(`/admin/quotes/${id}/details`),
  getQuoteResponses: (id: string) => api.get(`/admin/quotes/${id}/responses`),
  createManualQuote: (data: any) => api.post('/admin/quotes/manual', data),
  distributeQuote: (id: string, organizationIds: string[]) =>
    api.post(`/admin/quotes/${id}/distribute`, { organizationIds }),
  closeQuote: (id: string, data: { organizationId?: string; price?: number; notes?: string; reason?: string }) =>
    api.post(`/admin/quotes/${id}/close`, data),
  escalateQuote: (id: string) => api.post(`/admin/quotes/${id}/escalate`),
  addQuoteNote: (id: string, note: string) => api.post(`/admin/quotes/${id}/notes`, { note }),
  
  // Payments
  getPayments: (params?: { status?: string; type?: string; providerId?: string; dateFrom?: string; dateTo?: string; limit?: number; skip?: number }) =>
    api.get('/admin/payments', { params }),
  getPayment: (id: string) => api.get(`/admin/payments/${id}`),
  getPaymentTimeline: (id: string) => api.get(`/admin/payments/${id}/timeline`),
  retryPayment: (id: string) => api.post(`/admin/payments/${id}/retry`),
  refundPayment: (id: string, amount?: number, reason?: string) =>
    api.post(`/admin/payments/${id}/refund`, { amount, reason }),
  
  // Payouts
  getPayouts: (params?: { status?: string; providerId?: string; limit?: number; skip?: number }) =>
    api.get('/admin/payouts', { params }),
  approvePayout: (id: string) => api.post(`/admin/payouts/${id}/approve`),
  holdPayout: (id: string, reason: string) => api.post(`/admin/payouts/${id}/hold`, { reason }),
  processPayout: (id: string) => api.post(`/admin/payouts/${id}/process`),
  
  // Disputes
  getDisputes: (params?: { status?: string; priority?: string; category?: string; ownerId?: string; limit?: number; skip?: number }) =>
    api.get('/admin/disputes', { params }),
  getDispute: (id: string) => api.get(`/admin/disputes/${id}`),
  getDisputeEvidence: (id: string) => api.get(`/admin/disputes/${id}/evidence`),
  getDisputeTimeline: (id: string) => api.get(`/admin/disputes/${id}/timeline`),
  assignDispute: (id: string, ownerId: string) => api.patch(`/admin/disputes/${id}/assign`, { ownerId }),
  updateDisputeStatus: (id: string, status: string) => api.patch(`/admin/disputes/${id}/status`, { status }),
  resolveDispute: (id: string, resolution: { decision: string; refundAmount?: number; notes: string }) =>
    api.post(`/admin/disputes/${id}/resolve`, resolution),
  requestEvidence: (id: string, party: 'customer' | 'provider', message: string) =>
    api.post(`/admin/disputes/${id}/request-evidence`, { party, message }),
  freezePayout: (id: string) => api.post(`/admin/disputes/${id}/freeze-payout`),
  warnParty: (id: string, party: 'customer' | 'provider', reason: string) =>
    api.post(`/admin/disputes/${id}/warn`, { party, reason }),
  addDisputeNote: (id: string, note: string) => api.post(`/admin/disputes/${id}/notes`, { note }),
  
  // Reviews
  getReviews: (params?: { rating?: number; flagged?: boolean; providerId?: string; limit?: number; skip?: number }) =>
    api.get('/admin/reviews', { params }),
  getReview: (id: string) => api.get(`/admin/reviews/${id}`),
  hideReview: (id: string, reason: string) => api.post(`/admin/reviews/${id}/hide`, { reason }),
  restoreReview: (id: string) => api.post(`/admin/reviews/${id}/restore`),
  flagReview: (id: string, reason: string) => api.post(`/admin/reviews/${id}/flag`, { reason }),
  removeFromRating: (id: string) => api.post(`/admin/reviews/${id}/exclude-rating`),
  
  // Map & Geo
  getNearbyProviders: (lat: number, lng: number, radius: number, limit?: number) =>
    api.get('/map/providers/nearby', { params: { lat, lng, radius, limit: limit || 50 } }),
  getMapHeatmap: (type: 'demand' | 'supply' | 'conversion') =>
    api.get('/admin/map/heatmap', { params: { type } }),
  getServiceZones: () => api.get('/admin/map/zones'),
  createServiceZone: (data: { name: string; coordinates: number[][]; priority?: number }) =>
    api.post('/admin/map/zones', data),
  updateServiceZone: (id: string, data: any) => api.patch(`/admin/map/zones/${id}`, data),
  deleteServiceZone: (id: string) => api.delete(`/admin/map/zones/${id}`),
  
  // 🎯 Assignment Engine API
  getLiveRequests: (params?: { lat?: number; lng?: number; radius?: number; limit?: number }) =>
    api.get('/map/requests/live', { params }),
  getMatchingProviders: (requestId: string) =>
    api.get(`/map/requests/${requestId}/matching`),
  getMatchingCandidates: (requestId: string, limit?: number) =>
    api.get(`/requests/${requestId}/matching`, { params: { limit } }),
  distributeRequest: (requestId: string, providerIds: string[]) =>
    api.post(`/requests/${requestId}/distribute`, { providerIds }),
  autoDistributeRequest: (requestId: string, count?: number) =>
    api.post(`/requests/${requestId}/distribute/auto`, null, { params: { count } }),
  getRequestDistributions: (requestId: string) =>
    api.get(`/requests/${requestId}/distributions`),
  assignProvider: (requestId: string, data: { providerId: string; price?: number; slotId?: string; notes?: string }) =>
    api.post(`/requests/${requestId}/assign`, data),
  createBookingFromRequest: (data: { requestId: string; providerId: string; price?: number; slotId?: string }) =>
    api.post('/bookings/create-from-request', data),
    
  // 📥 Provider Inbox API
  getProviderInbox: () => api.get('/provider/requests/inbox'),
  getProviderPressureSummary: () => api.get('/provider/pressure-summary'),
  getProviderMissedRequests: () => api.get('/provider/requests/missed'),
  providerAcceptRequest: (distributionId: string) =>
    api.post(`/provider/requests/${distributionId}/accept`),
  providerRejectRequest: (distributionId: string, reason?: string) =>
    api.post(`/provider/requests/${distributionId}/reject`, { reason }),
  providerMarkViewed: (distributionId: string) =>
    api.post(`/provider/requests/${distributionId}/view`),
  updateProviderPresence: (isOnline: boolean, acceptsQuickRequests?: boolean) =>
    api.post('/provider/presence/update', { isOnline, acceptsQuickRequests }),
  
  // Services & Categories (Admin CRUD)
  getServiceCategories: () => api.get('/services/categories'),
  getAllServiceCategories: () => api.get('/services/categories/all'),
  createServiceCategory: (data: any) => api.post('/services/categories', data),
  updateServiceCategory: (id: string, data: any) => api.put(`/services/categories/${id}`, data),
  deleteServiceCategory: (id: string) => api.delete(`/services/categories/${id}`),
  getServicesList: (params?: { categoryId?: string; search?: string }) => api.get('/services', { params }),
  getAllServicesList: () => api.get('/services/all'),
  getService: (id: string) => api.get(`/services/${id}`),
  createService: (data: any) => api.post('/services', data),
  updateService: (id: string, data: any) => api.put(`/services/${id}`, data),
  deleteService: (id: string) => api.delete(`/services/${id}`),
  
  // Provider-Services (Org Services)
  getOrgServices: (orgId: string) => api.get(`/provider-services/organization/${orgId}`),
  
  // Settings & Config
  getConfig: () => api.get('/admin/config'),
  setConfig: (key: string, value: any) => api.post('/admin/config', { key, value }),
  getCommissionTiers: () => api.get('/admin/config/commission-tiers'),
  updateCommissionTier: (tier: string, data: any) => api.patch(`/admin/config/commission-tiers/${tier}`, data),
  getFeatureFlags: () => api.get('/admin/config/features'),
  setFeatureFlag: (flag: string, enabled: boolean) => api.post('/admin/config/features', { flag, enabled }),
  
  // Audit Log
  getAuditLog: (params?: { userId?: string; action?: string; entityType?: string; dateFrom?: string; dateTo?: string; limit?: number; skip?: number }) =>
    api.get('/admin/audit-log', { params }),
  
  // Reports & Export
  exportData: (entity: string, params?: any) =>
    api.get(`/admin/export/${entity}`, { params }),
  getReport: (type: string, params?: { dateFrom?: string; dateTo?: string; groupBy?: string }) =>
    api.get(`/admin/reports/${type}`, { params }),
  
  // Notifications Admin
  getNotificationTemplates: () => api.get('/admin/notifications/templates'),
  createNotificationTemplate: (data: any) => api.post('/admin/notifications/templates', data),
  updateNotificationTemplate: (id: string, data: any) => api.patch(`/admin/notifications/templates/${id}`, data),
  sendBulkNotification: (data: { title: string; message: string; templateCode?: string; filters?: any; channels?: string[] }) =>
    api.post('/admin/notifications/bulk', data),
  getBulkNotifications: (params?: { limit?: number; skip?: number }) =>
    api.get('/admin/notifications/history', { params }),
  
  // Metrics & Analytics (extended)
  getProviderMetrics: (id: string) => api.get(`/admin/providers/${id}/metrics`),
  getCategoryMetrics: () => api.get('/admin/metrics/categories'),
  getCityMetrics: () => api.get('/admin/metrics/cities'),
  getConversionMetrics: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get('/admin/metrics/conversion', { params }),
  
  // Global Search
  globalSearch: (query: string) => api.get('/admin/search', { params: { q: query } }),
  
  // 🌍 Zone Engine API (City-Level Control)
  getZones: () => api.get('/admin/zones'),
  getZone: (id: string) => api.get(`/admin/zones/${id}`),
  getZoneHeatmap: () => api.get('/admin/zones/heatmap'),
  getHotZones: () => api.get('/admin/zones/hot'),
  getDeadZones: () => api.get('/admin/zones/dead'),
  getZoneKPIs: (cityId?: string) => api.get('/admin/zones/kpis', { params: cityId ? { cityId } : {} }),
  createZone: (data: any) => api.post('/admin/zones', data),
  performZoneAction: (zoneId: string, actionType: string, data: any) => 
    api.post(`/admin/zones/${zoneId}/action`, { actionType, data }),
  findSupplyPull: (zoneId: string, limit?: number) => 
    api.get(`/admin/zones/${zoneId}/supply-pull`, { params: { limit } }),
    
  // 🔥 Demand Engine API
  getDemandMetrics: (cityId?: string) => api.get('/admin/demand/metrics', { params: cityId ? { cityId } : {} }),
  getDemandHeatmap: () => api.get('/admin/demand/heatmap'),
  getDemandHotAreas: () => api.get('/admin/demand/hot-areas'),
  getDemandSurge: () => api.get('/admin/demand/surge'),
  
  // 🤖 Market Control API (Automated Marketplace)
  getMarketRules: () => api.get('/admin/market/rules'),
  getMarketRule: (id: string) => api.get(`/admin/market/rules/${id}`),
  createMarketRule: (data: any) => api.post('/admin/market/rules', data),
  updateMarketRule: (id: string, data: any) => api.put(`/admin/market/rules/${id}`, data),
  toggleMarketRule: (id: string) => api.post(`/admin/market/rules/${id}/toggle`),
  deleteMarketRule: (id: string) => api.delete(`/admin/market/rules/${id}`),
  getMarketStats: () => api.get('/admin/market/stats'),
  getMarketAutoMode: () => api.get('/admin/market/auto-mode'),
  setMarketAutoMode: (data: { enabled: boolean }) => api.post('/admin/market/auto-mode', data),
  getMarketExecutions: (params?: { ruleId?: string; zoneId?: string; limit?: number }) => 
    api.get('/admin/market/executions', { params }),
  triggerMarketRules: (zoneId: string) => api.post(`/admin/market/trigger/${zoneId}`),
  
  // 🧠 Learning Engine API (Self-Learning System)
  getLearningStats: () => api.get('/admin/market/learning/stats'),
  getRulePerformance: (ruleId?: string) => 
    api.get('/admin/market/learning/performance', { params: ruleId ? { ruleId } : {} }),
  getMarketKPIs: (params?: { scope?: string; zoneId?: string; periodType?: string; limit?: number }) =>
    api.get('/admin/market/learning/kpis', { params }),
  getExperiments: (status?: string) => 
    api.get('/admin/market/learning/experiments', { params: status ? { status } : {} }),
  createExperiment: (data: any) => api.post('/admin/market/learning/experiments', data),
  startExperiment: (id: string) => api.post(`/admin/market/learning/experiments/${id}/start`),
  forceMeasurement: (executionId: string) => api.post(`/admin/market/learning/measure/${executionId}`),
};

export default api;
