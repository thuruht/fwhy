# Unified Backend Architecture Plan

## Overview
Consolidating all backend worker functionality into a single unified admin worker with enhanced features, plus creating a separate SPA for Howdy Thrift.

## 1. Unified Admin Worker Features

### Current Features to Consolidate
From the chat-provided worker code (not old directory files):
- **Events Management**: Create, edit, delete, and list events
- **Flyer Upload & Management**: Image handling and thumbnails
- **Newsletter/Blog System**: Content management and subscriber handling
- **Gallery Management**: Image gallery features
- **Admin Authentication**: Secure admin access

### New Features to Add
- **Drink Menu Editor**: Full CRUD operations for menu items
- **Operating Hours Management**: Edit open/close times for both venues
- **Venue-Specific Settings**: Separate configurations for Farewell vs Howdy

### Enhanced Admin Dashboard
- **Unified Interface**: Single admin panel for all features
- **Real-time Updates**: Live preview of changes
- **Batch Operations**: Bulk editing capabilities
- **Media Library**: Centralized asset management

## 2. Menu Management System

### Database Schema
```typescript
interface DrinkMenu {
  id: string;
  venue: 'farewell' | 'howdy';
  category: string; // 'beer', 'cocktails', 'wine', 'spirits', 'non-alcoholic'
  name: string;
  description?: string;
  price: number;
  available: boolean;
  featured: boolean;
  created: string;
  updated: string;
}

interface OperatingHours {
  venue: 'farewell' | 'howdy';
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
  closed: boolean;
  specialHours?: string; // Holiday notes, etc.
}
```

### API Endpoints
```
POST /api/admin/menu/items - Create menu item
GET /api/admin/menu/items?venue=farewell - List items
PUT /api/admin/menu/items/:id - Update item
DELETE /api/admin/menu/items/:id - Delete item

POST /api/admin/hours - Update operating hours
GET /api/admin/hours?venue=farewell - Get hours
GET /api/public/hours?venue=farewell - Public hours endpoint
```

## 3. Howdy Thrift SPA Project

### Separate Application
- **Domain**: `thrift.howdybar.com` or `howdythrift.com`
- **Technology**: Modern SPA (React/Vue/Vanilla)
- **Admin Panel**: `admin.howdythrift.com`
- **Features**: 
  - Thrift store inventory management
  - Item categorization and search
  - Pricing and availability tracking
  - Customer favorites/wishlist
  - Sales reporting

### Database Schema
```typescript
interface ThriftItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  size?: string;
  brand?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  available: boolean;
  featured: boolean;
  tags: string[];
  created: string;
  updated: string;
}
```

## 4. Implementation Plan

### Phase 1: Unified Admin Worker
1. **Consolidate existing workers** into single codebase
2. **Add menu management** endpoints and UI
3. **Add operating hours** management
4. **Deploy to** `admin.farewellcafe.com`

### Phase 2: Enhanced Admin UI
1. **Build React-based** admin dashboard
2. **Implement real-time** updates
3. **Add bulk operations** and media library
4. **Add user management** and permissions

### Phase 3: Howdy Thrift SPA
1. **Create separate** thrift store application
2. **Build inventory** management system
3. **Implement search** and filtering
4. **Deploy to** dedicated subdomain

## 5. Development Environment

### Directory Structure
```
/
├── admin-worker/          # Unified admin backend
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── events.js
│   │   │   ├── menu.js
│   │   │   ├── hours.js
│   │   │   ├── newsletter.js
│   │   │   └── gallery.js
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── index.js
│   ├── admin-ui/         # Admin dashboard frontend
│   └── wrangler.toml
├── howdy-thrift/         # Separate thrift SPA
│   ├── src/
│   ├── admin/
│   └── package.json
└── main-site/            # Current website (this repo)
```

### Deployment Strategy
- **Main Site**: `farewellcafe.com` (current worker)
- **Admin Panel**: `admin.farewellcafe.com` (unified admin worker)
- **Thrift Store**: `howdythrift.com` (separate SPA)
- **Thrift Admin**: `admin.howdythrift.com` (thrift admin)

## Next Steps
1. **Review and consolidate** the chat-provided worker code
2. **Design the unified admin** worker architecture
3. **Implement menu and hours** management features
4. **Plan the Howdy Thrift** SPA requirements
5. **Set up development** environments and deployment pipelines
