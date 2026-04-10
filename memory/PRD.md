# Auto Platform - PRD

## Original Problem Statement
Clone the Auto Platform project (Uber for Services marketplace) from GitHub and implement P1 admin panel features:
1. Audit Log UI - history of all system actions
2. Global Search (Cmd+K) - instant search across all entities
3. Notifications UI - bulk notifications management with templates
4. Reports & Export - KPIs, metrics, CSV export

## Architecture
- **Backend**: NestJS (port 3001) proxied via FastAPI (port 8001)
- **Admin Panel**: Vite React, served via FastAPI at /api/admin-panel/
- **Frontend**: React (port 3000) - mobile app frontend (not in scope)
- **Database**: MongoDB (auto_platform)

## Core Requirements (Static)
- Full-featured marketplace platform for on-demand services
- Real-time tracking, demand-based pricing, smart matching
- Complete admin panel for operations management
- Control layer for marketplace operations

## User Personas
1. **Admin/Operator** - manages marketplace, monitors KPIs, handles disputes
2. **Provider** - service providers (mechanics, etc.)
3. **Customer** - end users requesting services

## What's Been Implemented

### P0 — Core Platform (Pre-existing)
- Auth, Users, Organizations, Bookings, Quotes, Payments, Disputes, Reviews
- Admin Panel with 17+ pages
- WebSocket real-time
- Assignment Engine, Provider Inbox, Expire Engine
- Live Movement System, Demand Engine
- Zone Engine (City-Level Control)
- Marketplace Rules Engine (Self-Balancing)

### P1 — Control Layer (Implemented April 10, 2026)

#### 1. Audit Log UI
- **Page**: `/audit-log`
- **Features**:
  - Full history of all system actions
  - Filters: actor (ADMIN/SYSTEM/PROVIDER/CUSTOMER), entityType, action, date range
  - Expandable log entries with old/new values
  - Pagination
- **API**: GET `/api/admin/audit-log`

#### 2. Global Search (Cmd+K)
- **Component**: GlobalSearchModal
- **Features**:
  - Keyboard shortcut: Cmd+K (or Ctrl+K)
  - Instant search across users, providers, bookings, quotes
  - Search by ID, email, phone, name
  - Keyboard navigation (↑↓ + Enter)
  - Direct navigation to entity pages
- **API**: GET `/api/admin/search?q=query`

#### 3. Notifications UI
- **Page**: `/notifications`
- **Tabs**:
  - Send: bulk notification form with filters (tiers, score, online status)
  - Templates: create/manage notification templates
  - History: sent notifications log
- **APIs**: 
  - GET `/api/admin/notifications/templates`
  - POST `/api/admin/notifications/templates`
  - POST `/api/admin/notifications/bulk`
  - GET `/api/admin/notifications/history`

#### 4. Reports & Export
- **Page**: `/reports`
- **Report Types**:
  - KPIs: GMV, revenue, bookings, completion rate
  - Revenue: with charts, grouping by day/week/month
  - Bookings: status distribution, completion/cancel rates
  - Providers: tier distribution, active rate
  - Conversion: funnel (quotes → responses → bookings)
- **Export**: CSV download for users, organizations, bookings, payments, quotes
- **APIs**:
  - GET `/api/admin/reports/:type`
  - GET `/api/admin/export/:entity`

## API Endpoints Summary (New)
- GET `/api/admin/audit-log` - audit logs with filters
- GET `/api/admin/search` - global search
- GET `/api/admin/notifications/templates` - notification templates
- POST `/api/admin/notifications/templates` - create template
- POST `/api/admin/notifications/bulk` - send bulk notification
- GET `/api/admin/notifications/history` - sent notifications
- GET `/api/admin/reports/:type` - report data
- GET `/api/admin/export/:entity` - CSV export

## DB Models (New)
- `audit_logs`: userId, actor, action, entityType, entityId, oldValue, newValue, metadata
- `notification_templates`: code, title, message, category, channels, variables
- `bulk_notifications`: sentBy, title, message, filters, recipientCount, status

### P2 — Connected Operator System (Implemented April 10, 2026)

#### 1. Quick Actions Panel (⌘J)
- **Component**: QuickActionsPanel
- **Features**:
  - Keyboard shortcut: Cmd+J
  - Navigation buttons with shortcuts: Создать заявку (Q), Найти клиента (C), Найти мастера (P), Отправить Push (N), Проблемные заказы (X), Буст зоны (B)
  - Instant actions: Включить Surge, Push всем онлайн мастерам, Отключить Auto Distribution
  - One-click execution without page navigation

#### 2. Global Search with Inline Actions (⌘K Enhanced)
- Inline action buttons appear for search results:
  - Providers: Boost, Limit, Push
  - Bookings: Reassign, Call
  - Users: Push
- Actions execute without leaving search modal
- Keyboard navigation preserved

#### 3. Providers Page with Bulk Actions
- Checkbox selection for multiple providers
- Floating bulk actions bar when providers selected:
  - Boost All, Limit All, Send Push
- Inline action buttons per row (Boost, Limit, Send)

#### 4. Dashboard Alert → Action Flow
- Alerts now include contextual action buttons:
  - Supply alerts: Boost Supply, Send Push
  - SLA alerts: Reassign, Escalate
  - Dispute alerts: View
- One-click resolution without navigation

#### 5. Sidebar Restructured
- Grouped navigation by function:
  - CORE: Дашборд, Live Monitor, Geo Ops
  - OPERATIONS: Market Control, Мастера, Provider Inbox, Бронирования, Заявки, Клиенты
  - CONTROL: Уведомления, Платежи, Споры, Отзывы
  - ANALYTICS: Отчёты, Audit Log
  - SYSTEM: Пользователи, Организации, Услуги, Карта, Настройки
- Connection status indicator (Wifi icon)
- Quick Actions button with ⌘J shortcut

### P3 — Система оптимизации рынка (Implemented April 10, 2026)

#### 1. Feature Flags + Experiments
- **Page**: `/feature-flags`
- **Feature Flags**:
  - Toggle enable/disable instantly
  - Rollout percentage control (0-100%)
  - Conditions: cities, tiers, minScore
  - Types: release, experiment, ops
  - CRUD operations with audit logging
- **Experiments** (A/B Testing):
  - Multiple variants with traffic split
  - Success metrics: conversion_rate, gmv, response_time, completion_rate
  - Statuses: draft, active, paused, completed
- **APIs**:
  - `GET/POST /api/admin/feature-flags`
  - `PATCH /api/admin/feature-flags/:id`
  - `POST /api/admin/feature-flags/:key/toggle`
  - `GET/POST /api/admin/experiments`
  - `PATCH /api/admin/experiments/:id/status`

#### 2. Auto-Suggested Actions
- **Page**: `/suggestions`
- **Decision Engine**: System analyzes data and recommends actions
- **Suggestion Types**:
  - `provider_low_performance` - мастер с низким score
  - `overdue_dispute` - просроченный спор (>48h)
  - `stuck_booking` - завис заказ (>2h без прогресса)
  - `quote_no_response` - заявка без ответов (>30min)
  - `inactive_top_provider` - неактивный gold/platinum мастер
- **Severity levels**: critical, warning, info
- **One-click actions**: limit, boost, send push, reassign, escalate
- **APIs**:
  - `GET /api/admin/suggestions`
  - `POST /api/admin/suggestions/:id/execute`

#### 3. Reputation Control
- **Page**: `/providers/:providerId/reputation`
- **Features**:
  - View/adjust provider rating with reason
  - Hide reviews with reason
  - Add trust flags (verified_documents, premium_partner, etc.)
  - Penalize provider (warning, score_reduction, suspension)
  - Full reputation history timeline
- **APIs**:
  - `GET /api/admin/providers/:id/reputation`
  - `POST /api/admin/providers/:id/reputation/rating`
  - `POST /api/admin/reviews/:id/hide`
  - `POST /api/admin/providers/:id/reputation/trust-flag`
  - `POST /api/admin/providers/:id/reputation/penalize`

## DB Models (P3)
- `feature_flags`: key, name, enabled, rollout, conditions, type
- `experiments`: name, featureFlagKey, variants, metric, status, results
- `reputation_actions`: providerId, actionType, oldValue, newValue, reason

## Pending Tasks (Backlog)

### P2 — Strength Features
- Map modes: conversion/risk/coverage views
- Disputes evidence flow
- Payment actions (refund/retry)
- Push integration for automated rules
- Commission auto-adjustments
- Supply activation triggers

### P3 — Future/Backlog
- Prediction engine, demand forecast
- Anomaly detection, smart expansion
- Economic Model: monetization, margin control, subsidies
- A/B testing runner (Feature Flags + Experiments)
- Parameter auto-tuning, zone-level tuning

## Next Action Items
1. Add more sample data to demonstrate audit log functionality
2. Implement push notification delivery (currently logged only)
3. Add chart visualizations to more report types
4. Implement Feature Flags UI with A/B testing capabilities
