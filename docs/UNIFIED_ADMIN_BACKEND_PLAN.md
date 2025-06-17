# Unified Admin Backend Plan
**Repository:** https://github.com/thuruht/fwhyadmin.git

## Architecture Overview

This document outlines the consolidated admin backend that will replace all disparate worker scripts and provide a unified API for:
- Event management and listing
- Flyer upload and processing
- Newsletter/blog management  
- Menu editing (food & drinks)
- Operating hours management
- Admin authentication and dashboard

## Project Structure
```
fwhyadmin/
├── src/
│   ├── index.js                 # Main Cloudflare Worker entry point
│   ├── auth/
│   │   ├── middleware.js        # Authentication middleware
│   │   └── handlers.js          # Login, logout, session management
│   ├── events/
│   │   ├── handlers.js          # Event CRUD operations
│   │   ├── scraper.js           # Event scraping logic
│   │   └── deduplication.js     # Event deduplication
│   ├── flyers/
│   │   ├── upload.js            # Flyer upload handling
│   │   └── batch.js             # Batch upload processing
│   ├── newsletter/
│   │   ├── posts.js             # Blog post management
│   │   └── subscribers.js       # Newsletter subscriber management
│   ├── menu/
│   │   ├── food.js              # Food menu management
│   │   └── drinks.js            # Drinks menu management
│   ├── hours/
│   │   └── operating.js         # Operating hours management
│   ├── utils/
│   │   ├── cors.js              # CORS handling
│   │   ├── validation.js        # Input validation
│   │   └── responses.js         # Standard API responses
│   └── dashboard/
│       └── spa.js               # Admin dashboard SPA serving
├── static/
│   ├── admin/
│   │   ├── index.html           # Admin dashboard
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   └── thrift/
│       ├── index.html           # Howdy Thrift SPA
│       ├── admin/               # Thrift admin panel
│       ├── css/
│       ├── js/
│       └── assets/
├── wrangler.toml                # Cloudflare Worker configuration
├── package.json
├── README.md
└── .env.example
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/verify` - Verify session

### Events
- `GET /api/events` - List events (public)
- `GET /api/events/{venue}` - List events by venue (public)
- `POST /api/events` - Create event (admin)
- `PUT /api/events/{id}` - Update event (admin)
- `DELETE /api/events/{id}` - Delete event (admin)
- `POST /api/events/scrape` - Trigger event scraping (admin)

### Flyers
- `POST /api/flyers/upload` - Single flyer upload (admin)
- `POST /api/flyers/batch` - Batch flyer upload (admin)
- `GET /api/flyers` - List flyers (admin)
- `DELETE /api/flyers/{id}` - Delete flyer (admin)

### Newsletter/Blog
- `GET /api/posts` - List blog posts (public)
- `POST /api/posts` - Create post (admin)
- `PUT /api/posts/{id}` - Update post (admin)
- `DELETE /api/posts/{id}` - Delete post (admin)
- `GET /api/subscribers` - List subscribers (admin)

### Menu Management
- `GET /api/menu/food` - Get food menu (public)
- `PUT /api/menu/food` - Update food menu (admin)
- `GET /api/menu/drinks` - Get drinks menu (public)
- `PUT /api/menu/drinks` - Update drinks menu (admin)

### Operating Hours
- `GET /api/hours` - Get operating hours (public)
- `PUT /api/hours` - Update operating hours (admin)

### Admin Dashboard
- `GET /admin` - Serve admin dashboard SPA
- `GET /admin/*` - Admin dashboard routes

### Howdy Thrift
- `GET /thrift` - Serve Howdy Thrift SPA
- `GET /thrift/*` - Thrift SPA routes
- `GET /thrift/admin` - Thrift admin panel

## Domain Configuration

### Production Domains
- **Main Admin:** `admin.farewellcafe.com`
- **Thrift:** `thrift.farewellcafe.com` or `howdythrift.com`
- **API:** `api.farewellcafe.com` (or subdirectory of admin)

### Development Domains
- **Admin:** `fwhyadmin.dev` (Cloudflare Worker subdomain)
- **API:** Same worker, different routes

## Environment Variables
```
# Authentication
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=
JWT_SECRET=

# External APIs
KIT_API_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# Database (KV or D1)
KV_NAMESPACE=
D1_DATABASE=

# CORS Origins
ALLOWED_ORIGINS=https://farewellcafe.com,https://dev.farewellcafe.com

# Feature Flags
ENABLE_EVENT_SCRAPING=true
ENABLE_BATCH_UPLOAD=true
```

## Data Models

### Event
```javascript
{
  id: string,
  title: string,
  venue: 'farewell' | 'howdy',
  date: string (ISO),
  time: string,
  description: string,
  flyerUrl: string,
  ticketUrl: string,
  source: string,
  createdAt: string,
  updatedAt: string
}
```

### Menu Item (Food/Drinks)
```javascript
{
  id: string,
  name: string,
  description: string,
  price: number,
  category: string,
  available: boolean,
  image: string,
  allergens: string[],
  modifiers: object[]
}
```

### Operating Hours
```javascript
{
  venue: 'farewell' | 'howdy',
  hours: {
    monday: { open: string, close: string, closed: boolean },
    tuesday: { open: string, close: string, closed: boolean },
    // ... rest of week
  },
  specialHours: [
    { date: string, open: string, close: string, closed: boolean, note: string }
  ],
  timezone: string
}
```

## Integration Points

### Frontend Integration
The main frontend (`farewellcafe.com`) will consume:
- `GET /api/events/{venue}` for event listings
- `GET /api/menu/food` and `GET /api/menu/drinks` for menu display
- `GET /api/hours` for operating hours display

### Legacy Compatibility
Maintain compatibility with existing frontend calls:
- `/list/{venue}` → redirect to `/api/events/{venue}`
- Ensure CORS headers match current setup

## Security Considerations

1. **Authentication:** JWT-based admin sessions
2. **CORS:** Strict origin control for admin endpoints
3. **Rate Limiting:** Implement for public endpoints
4. **Input Validation:** Sanitize all inputs
5. **File Upload:** Secure flyer upload with type/size restrictions

## Deployment Strategy

1. **Phase 1:** Set up unified worker with basic admin auth
2. **Phase 2:** Migrate event management from existing workers
3. **Phase 3:** Add menu and hours management
4. **Phase 4:** Build admin dashboard SPA
5. **Phase 5:** Create Howdy Thrift SPA and admin panel
6. **Phase 6:** Production cutover with domain routing

## Next Steps

1. Initialize the `fwhyadmin` repository
2. Set up basic Cloudflare Worker structure
3. Implement authentication middleware
4. Begin consolidating existing worker functionality
5. Build admin dashboard interface
6. Test with existing frontend integration
