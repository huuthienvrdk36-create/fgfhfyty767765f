# Auto Platform - Service Marketplace (Uber for Services)

A full-featured marketplace platform for on-demand services with real-time tracking, demand-based pricing, and smart matching.

## 🚀 Quick Start (One-Click Deploy)

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Yarn

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/auto-platform.git
cd auto-platform

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Manual Setup

```bash
# 1. Install backend dependencies
cd backend
yarn install
cp .env.example .env
# Edit .env with your MongoDB URL

# 2. Build NestJS backend
yarn build

# 3. Install frontend dependencies
cd ../frontend
yarn install
cp .env.example .env

# 4. Build admin panel
cd ../admin
yarn install
yarn build

# 5. Seed database
cd ../backend
yarn seed

# 6. Start services
yarn start:dev  # Backend on port 3001
cd ../frontend && yarn start  # Frontend on port 3000
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│                         Port 3000                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   FASTAPI PROXY (Python)                     │
│                         Port 8001                            │
│    - Routes /api/* to NestJS                                │
│    - Serves admin panel at /api/admin-panel/                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   NESTJS BACKEND (TypeScript)               │
│                         Port 3001                            │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Auth     │  │  Bookings   │  │   Quotes    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Matching   │  │  Assignment │  │Provider Inbox│        │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Live Movement│  │Demand Engine│  │   Realtime  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB Database                          │
│                         Port 27017                           │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Core Modules

### 1. Assignment Engine
- Geo-based matching with $geoNear
- Visibility & behavioral scoring
- Smart ranking algorithm

### 2. Provider Inbox
- Real-time request distribution
- Pressure timer system (20-60s TTL)
- Behavioral scoring (+5 accept, -3 reject)
- Tier system: Bronze → Silver → Gold → Platinum

### 3. Expire Engine
- CRON job every 5 seconds
- Auto re-distribution (max 3 attempts)
- Urgency escalation
- Operator fallback

### 4. Current Job System
- Status lifecycle: pending → confirmed → on_route → arrived → in_progress → completed
- Provider current job screen
- Customer live booking view

### 5. Live Movement System (Uber-like)
- Real-time location tracking
- Auto-arrived at < 100m
- "Almost there" at < 200m
- Anomaly detection (stuck, wrong direction)
- ETA recalculation

### 6. Demand Engine
- Supply/Demand ratio calculation
- Surge pricing (1.0x - 2.5x)
- Dynamic distribution size (3-7 providers)
- TTL scaling based on demand
- Geo heatmap for admin

## 🔐 Test Credentials

### Admin Panel
- **URL**: `/api/admin-panel/`
- **Email**: admin@autoservice.com
- **Password**: Admin123!

### Provider (BMW Garage)
- **Email**: provider@bmwgarage.com
- **Password**: Provider123!

## 📡 API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
```

### Current Job
```
GET  /api/provider/current-job
POST /api/bookings/:id/action/start_route
POST /api/bookings/:id/action/arrive
POST /api/bookings/:id/action/start_work
POST /api/bookings/:id/action/complete
```

### Live Movement
```
POST /api/live/location
POST /api/live/presence
GET  /api/live/booking/:id
GET  /api/live/providers
```

### Demand Engine
```
GET  /api/admin/demand/metrics
GET  /api/admin/demand/surge
GET  /api/admin/demand/heatmap
GET  /api/admin/demand/hot-areas
```

### Provider Inbox
```
GET  /api/provider-inbox/:providerId
POST /api/provider-inbox/:providerId/accept/:distributionId
POST /api/provider-inbox/:providerId/reject/:distributionId
```

## 🗺️ Admin Panel Features

1. **Dashboard** - Overview statistics
2. **Users** - Customer management
3. **Organizations** - Provider management
4. **Provider Inbox** - Uber-like driver interface
5. **Map** - Geo Operations Center with real-time tracking
6. **Bookings** - Order management
7. **Quotes** - Request management
8. **Payments** - Transaction history
9. **Disputes** - Conflict resolution
10. **Reviews** - Rating management

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

## 📁 Project Structure

```
/app
├── backend/           # NestJS + FastAPI
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   ├── demand/
│   │   │   ├── provider-inbox/
│   │   │   └── ...
│   │   └── shared/
│   ├── server.py      # FastAPI proxy
│   └── package.json
├── frontend/          # React app
├── admin/             # Vite + React admin panel
├── scripts/           # Setup scripts
└── memory/            # PRD & credentials
```

## 🔧 Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=auto_platform
JWT_ACCESS_SECRET=your_secret_key
PORT=3001
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 📈 KPIs

- **Response Time**: < 30 seconds (good)
- **Match Success Rate**: requests → deals
- **Missed Rate**: ignored requests
- **Completion Rate**: bookings → completed

## 🛣️ Roadmap

- [x] Assignment Engine
- [x] Provider Inbox
- [x] Expire Engine
- [x] Current Job System
- [x] Live Movement
- [x] Demand Engine
- [ ] WebSocket real-time updates
- [ ] Push notifications
- [ ] Route polyline (Mapbox/Google)
- [ ] Mobile app

## 📝 License

MIT
