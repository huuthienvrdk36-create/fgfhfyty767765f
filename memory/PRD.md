# Auto Platform - PRD

## Original Problem Statement
Clone the provided Auto Platform project (Uber for Services marketplace) and implement:
1. City-Level Control System (Zones, GeoOps)
2. Automated Marketplace (Rules Engine)
3. Self-Learning Marketplace (KPI-driven feedback loops)
4. Complete audit of admin panel + fix critical gaps

## Architecture
- **Backend**: NestJS (port 3001) proxied via FastAPI (port 8001)
- **Admin Panel**: Vite React (port 3002), served via FastAPI at /api/admin-panel/
- **Frontend**: React (port 3000)
- **DB**: MongoDB

## Implemented Features

### Phase 1 — Core Platform (DONE)
- Auth, Users, Organizations, Bookings, Quotes, Payments, Disputes, Reviews
- Admin Panel with 17 pages
- WebSocket real-time

### Phase 2 — City-Level Control System (DONE)
- Zones module (backend/src/modules/zones/)
- Zone KPIs, heatmaps, dead/hot zones
- GeoOps Page UI

### Phase 3 — Automated Marketplace (DONE)
- Rules Engine (marketplace-rules-engine.service.ts)
- Rule executions, auto-balancing (surge, distribution)
- MarketControl Page UI

### Phase 4 — Self-Learning Marketplace (DONE)
- Learning Engine (learning-engine.service.ts)
- KPI tracking, rule performance scoring
- Learning tab in MarketControl

### Phase 5 — P0 Admin Panel Fixes (DONE — April 9, 2026)
1. **Services CRUD** — Real API (categories, services, pricing) replacing mock data
2. **Quote Distribution UI** — Provider selection panel with checkboxes, search, score display
3. **Settings → API** — Loads/saves config via GET/POST /api/admin/config
4. **Organization ↔ Services** — Real services and bookings tabs in org modal
5. **Provider real data** — Removed all Math.random() from ProvidersPage and ProviderDetailPage

## Pending Tasks

### P1 — Professional Features
- Audit Log UI (API exists, UI missing)
- Global Search UI (API exists, UI missing)
- Notifications UI (API exists, UI missing)
- Reports & Export UI (API exists, UI missing)

### P2 — Strength Features
- Map modes: conversion/risk/coverage (currently stubs)
- Disputes evidence flow
- Payment actions (refund/retry)
- Push integration for automated rules
- Commission auto-adjustments
- Supply activation triggers

### P3 — Future/Backlog
- Prediction engine, demand forecast
- Anomaly detection, smart expansion
- Economic Model: monetization, margin control, subsidies
- A/B testing runner
- Parameter auto-tuning, zone-level tuning

## Key API Endpoints
- GET/POST /api/services, /api/services/categories
- PUT/DELETE /api/services/:id, /api/services/categories/:id
- GET /api/admin/config, POST /api/admin/config
- GET /api/admin/zones, /api/admin/zones/kpis
- GET /api/admin/marketplace-rules
- GET /api/admin/marketplace-rules/learning/stats
- POST /api/admin/marketplace-rules/trigger/:zoneId
- GET /api/provider-services/organization/:orgId

## DB Models
- zones, marketplace_rules, rule_executions, market_kpis
- ServiceCategory: {name, slug, description, icon, sortOrder, status}
- Service: {categoryId, name, slug, description, priceMin, priceMax, durationMin, durationMax, requiresDiagnostics, status}
- PlatformConfig: {key, value, description, isSecret}
