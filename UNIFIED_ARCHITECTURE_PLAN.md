# Unified Farewell Cafe & Howdy Venue: Architecture & Roadmap

**Last Updated: June 15, 2025**

**Document Purpose:** This document serves as the central, authoritative guide for the development, maintenance, and future evolution of the unified administrative backend and public-facing frontend for Farewell Cafe and the Howdy venue. It is intended for current and future development teams to ensure consistency, clarity, and adherence to the project vision.

## 1. Core Project Vision & "The Whole Point"

The fundamental goal of this project is to:

1. **Create a single, modernized, and highly efficient administrative backend** for both "Farewell Cafe" and the "Howdy" venue. This central admin system, accessible via `admin.farewellcafe.com`, will streamline all key operational tasks: managing blog content, menus, comprehensive event listings (complete with flyers for slideshows, listings, and archives), flyer postings, business hours, and other administrative functions.
2. **Ensure this new system is a significant enhancement of the previous setup.** This means retaining core functionalities while vastly improving them with modern styling, crucial "extra fields" and data points (like dedicated flyer URLs for events), and a robust, maintainable, and consolidated Cloudflare-based infrastructure.
3. **Deliver a seamless, rich, and accurate experience on the public-facing frontend** (`dev.farewellcafe.com`). This includes ensuring that all content managed through the new admin panel—especially blog posts with their R2 images and slugs, and detailed event listings with their associated flyer images—is displayed correctly and effectively.
4. **Achieve this through critical technical upgrades and migrations:** This involves implementing unified authentication, migrating data from older systems (blog images from local files to R2, event data from disparate KVs into the unified D1 and their flyers to R2), standardizing configurations with a single `wrangler.jsonc`, and cleaning up redundant code and infrastructure.

This project aims to replace and significantly upgrade the previous systems, drawing inspiration from the user experience of `farewellcafe.com` but with enhanced capabilities and a more resilient backend.

## 2. Key Cloudflare Production Resource Configuration

This section outlines the definitive Cloudflare resources to be used by the `fwhyadmin` worker (serving `admin.farewellcafe.com`) and potentially the frontend worker. The `wrangler.jsonc` file for the `admin` environment has been configured to bind only these resources. Any previously bound resources not listed here are considered deprecated for the `fwhyadmin` worker, and relevant data must be migrated to these unified resources.

### 2.1. D1 Database (Primary Data Store)

- **Cloudflare D1 Database Name:** `fwhy_uni_db`
- **Cloudflare D1 Database ID:** `4f9ac7d3-ff64-45f5-a538-d8eb3b978f41`
- **Binding in `wrangler.jsonc` & Code:** `UNIFIED_DB`
- **Purpose:** Primary storage for blog posts, events, menu items, user data, and other structured application data.
- **Migration:** All relevant data from older D1 databases (e.g., `bl0wd1`, `farewell_list`, `fwhygal0r3_db`, `howdy_list`) must be migrated to `fwhy_uni_db`.

### 2.2. R2 Bucket (Asset Storage)

- **Cloudflare R2 Bucket Name:** `fwhy-blog-images`
- **Binding in `wrangler.jsonc` & Code:** `BLOG_IMAGES_R2`
- **Purpose:** Storage for blog post images, event flyers, menu item images, and other static assets for the admin system and public site.
- **Public URL Prefix (Confirmed):** `https://fwhy-bimg.farewellcafe.com` (This custom domain is configured to serve content from this R2 bucket publicly).
- **Migration:** Blog images are being migrated from local files. Event flyers will be migrated. Any essential images from other R2 buckets (e.g., `unified-assets-dev`, `fyg410r3`) must be migrated to `fwhy-blog-images`.

### 2.3. KV Namespaces (Key-Value Storage)

- **`EVENTS_KV`** (ID: `464d611d5ad8433cab6bcfba64d8424f`)
  - **Purpose:** Initially for migrating old event data. Long-term, event data will reside primarily in the `UNIFIED_DB`. This KV might be phased out for events post-migration or used for caching.
  - **Migration:** Data from `EVENTS_FAREWELL` and `EVENTS_HOWDY` to be migrated into `UNIFIED_DB` (events table). This KV binding might be temporary for the migration process.
- **`SESSIONS_KV`** (ID: `2038b95e785545af8486bc353c3cbe62`)
  - **Purpose:** Storage for admin user sessions.
- **`GALLERY_KV`** (ID: `3cd37bd71260436c8ed12078483e9fa4`)
  - **Purpose:** Storage for gallery configurations or data (if not moved to D1).
- **`BLOG_KV`** (ID: `6ee9ab6b71634a4eb3e66de82d8dfcdc`)
  - **Purpose:** Storage for blog-related settings or auxiliary data not suitable for D1 (e.g., view counters, temporary drafts if not in D1).
- **`CONFIG_KV`** (ID: `d54801ef0fb0443e850ee532ad1384b6`)
  - **Purpose:** General application configuration and settings (e.g., feature flags, site-wide messages).
- **Migration for other KVs:** Data from other previously used KV namespaces (e.g., `bl0wkv`, `fff_kv`) must be evaluated and migrated to one of the above unified KV namespaces or D1 if still needed.

### 2.4. Cloudflare Worker Secrets

- **`ADMIN_PASSWORD_HASH`**: Bcrypt hash of the admin password for unified authentication.

## 3. Core Data Structures & Schemas

This section will be populated with the primary TypeScript interfaces and D1 table schemas as they are finalized.

### 3.1. `BlogPost` (D1 Table: `blog_posts`)

```typescript
// In: admin-worker/fwhyadmin/src/types/env.ts
export interface BlogPost {
  id: string; // UUID
  title: string;
  content: string; // HTML or Markdown
  author_id?: string; // Optional: links to a user table
  status: 'draft' | 'published' | 'archived';
  published_at?: string; // ISO 8601 string
  created_at: string; // ISO 8601 string
  updated_at: string; // ISO 8601 string
  tags?: string; // Comma-separated or JSON array
  category?: string;
  imageUrl?: string; // Full URL to image in R2 (e.g., fwhy-blog-images)
  slug: string | null; // SEO-friendly URL slug (unique)
}
```

**D1 SQL Schema for `blog_posts` table:**
```sql
CREATE TABLE IF NOT EXISTS blog_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT,
    status TEXT CHECK(status IN ('draft', 'published', 'archived')) NOT NULL DEFAULT 'draft',
    published_at TEXT, -- ISO 8601 string
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tags TEXT, -- Comma-separated or JSON array
    category TEXT,
    imageUrl TEXT, -- Full URL to image in R2
    slug TEXT UNIQUE
);
```

### 3.2. `Event` (D1 Table: `events`)

```typescript
// In: admin-worker/fwhyadmin/src/types/env.ts
export interface EventType {
  id: string; // UUID or unique identifier
  title: string;
  venue: 'farewell' | 'howdy'; // Or other relevant venue identifiers
  date: string; // ISO 8601 date string e.g., "YYYY-MM-DD"
  time?: string; // e.g., "HH:MM" or "HH:MM-HH:MM"
  description?: string;
  age_restriction?: string;
  suggested_price?: string;
  ticket_url?: string;
  flyer_url?: string; // Full URL to flyer image in R2 (e.g., fwhy-blog-images)
  thumbnail_url?: string; // Optional: URL to thumbnail in R2
  status?: 'active' | 'cancelled' | 'postponed' | 'past';
  featured?: boolean;
  slideshow_order?: number;
  created_at: string; // ISO 8601 string
  updated_at: string; // ISO 8601 string
  created_by?: string; // Optional: links to a user table
  last_modified_by?: string; // Optional: links to a user table
  slug?: string; // SEO-friendly URL slug (unique, optional)
}
```

**D1 SQL Schema for `events` table:**
```sql
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    venue TEXT CHECK(venue IN ('farewell', 'howdy')) NOT NULL,
    date TEXT NOT NULL, -- ISO 8601 date string e.g., "YYYY-MM-DD"
    time TEXT, -- e.g., "HH:MM" or "HH:MM-HH:MM"
    description TEXT,
    age_restriction TEXT,
    suggested_price TEXT,
    ticket_url TEXT,
    flyer_url TEXT, -- URL to image in R2 (e.g., fwhy-blog-images bucket)
    thumbnail_url TEXT, -- URL to thumbnail in R2 (optional)
    status TEXT CHECK(status IN ('active', 'cancelled', 'postponed', 'past')) NOT NULL DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    slideshow_order INTEGER, -- For ordering in slideshows
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    last_modified_by TEXT,
    slug TEXT UNIQUE
);
```

### 3.3. Menu Items (D1 Table: `menu_items`)
*(To be defined)*

### 3.4. Operating Hours (D1 Table: `operating_hours`)
*(To be defined)*

## 4. Project Roadmap & Phases

This roadmap outlines the planned phases for development and deployment.

### Phase 1: Backend Consolidation & Core Feature Migration (Current Focus)

* **Objective:** Establish the unified admin worker, migrate core data (blog, events), and ensure basic admin functionalities are operational.
* **Key Tasks:**
    1. **Finalize `wrangler.jsonc`:** Ensure all production bindings (D1, R2, KV, Secrets) are correct.
    2. **D1 Schema Setup:** Create/confirm all necessary tables (`blog_posts`, `events`, `menu_items`, `operating_hours`, `users` if needed) in `fwhy_uni_db`.
    3. **Authentication:** Implement and test unified admin authentication (session/cookie-based using `ADMIN_PASSWORD_HASH`).
    4. **Blog System Migration & Enhancement:**
        * Run migration script to move existing blog posts to D1 and images to R2 (`fwhy-blog-images`), generating slugs.
        * Update admin handlers for creating/editing blog posts to use D1 and R2, and generate slugs.
        * Ensure frontend can fetch and display blog posts with R2 images and slugs.
    5. **Event System Migration & Enhancement:**
        * Run migration script to move existing event data (from `EVENTS_FAREWELL`, `EVENTS_HOWDY` KVs) to the `events` table in D1, and upload flyers to R2.
        * Update admin handlers for creating/editing events to use D1 and R2 for flyers.
        * Ensure frontend can fetch and display events with R2 flyers for slideshows, listings, and archives.
    6. **Basic Admin Dashboard Structure:** Implement initial admin dashboard pages for managing blogs and events.
* **Deliverables:** Functional admin worker for blog and event management with migrated data; frontend displaying this content correctly.

### Phase 2: Full Admin Feature Implementation

* **Objective:** Implement all remaining admin functionalities (Menu, Hours, etc.) and enhance the admin dashboard UI/UX.
* **Key Tasks:**
    1. **Menu Management System:**
        * Define D1 schema and `MenuItemType`.
        * Implement admin handlers and UI for CRUD operations on menu items (categories, descriptions, prices, images to R2).
        * Ensure frontend can display menus.
    2. **Operating Hours Management:**
        * Define D1 schema and `OperatingHoursType`.
        * Implement admin handlers and UI for managing hours for Farewell & Howdy.
        * Ensure frontend can display operating hours.
    3. **Gallery Management:** Review existing gallery system and integrate/migrate to unified admin if necessary (data to D1/KV, images to R2).
    4. **Flyer Management (General):** If flyers are managed independently of events, implement this.
    5. **Admin Dashboard Enhancements:** Improve UI/UX, add search/filtering, potentially a media manager for R2 assets.
* **Deliverables:** Fully functional admin panel for all core business operations.

### Phase 3: Frontend Polish & Advanced Features

* **Objective:** Refine the public frontend, implement any advanced features, and conduct thorough testing.
* **Key Tasks:**
    1. **Frontend UI/UX Review & Polish:** Ensure `dev.farewellcafe.com` is polished, responsive, and user-friendly, accurately reflecting all data from the new backend.
    2. **Unified Popups & Slideshows:** Standardize and optimize these components.
    3. **SEO Optimization:** Ensure all content (especially blogs with slugs) is SEO-friendly.
    4. **Performance Optimization:** Optimize load times for frontend and backend.
    5. **Security Hardening & Review.**
    6. **Comprehensive Testing:** End-to-end testing of admin and frontend.
* **Deliverables:** A production-ready, polished, and robust system.

### Phase 4: Howdy Thrift SPA (If pursued as separate project)

* **Objective:** Develop and deploy the separate Howdy Thrift SPA.
* **Details:** Refer to original "Howdy Thrift SPA Project" section if this is reactivated. This roadmap primarily focuses on the unified Farewell/Howdy admin and site.

## 5. Data Migration Strategy - Detailed Notes

* **General Principle:** Migrate data from old sources (KVs, old D1s, local files) to the new unified resources (`fwhy_uni_db`, `fwhy-blog-images` R2, designated KVs).
* **Blog Migration:** (Covered in Phase 1) - `migration.ts` handler.
* **Event Migration:** (Covered in Phase 1) - `eventMigration.ts` handler. This involves reading from `EVENTS_FAREWELL` and `EVENTS_HOWDY` KVs, fetching/uploading flyers, and inserting into the `events` D1 table.
  * **Local Flyer Paths:** If old event flyer URLs are local file paths, a separate local script will be needed to read these files and upload them to R2. The worker-based migration can only fetch public HTTP URLs.
* **Menu/Hours/Other Data:** Specific migration scripts or manual data entry plans will be needed for these as their D1 schemas are finalized.
* **Backup:** Before running any large-scale migration, ensure backups of the source data (KVs, D1s) are taken if possible.

## 6. Development & Deployment

### 6.1. Code Structure

#### Main Project (Frontend & Root Configuration)
- **Location:** `/home/jeltu/Desktop/fnow`
- **Version Control:** Primary Git repository for the frontend and overall project coordination.
- **Configuration:** Contains the root `wrangler.jsonc` which defines the `dev_frontend` environment and may contain other top-level configurations.

#### Admin Backend Worker
- **Project Location:** `/home/jeltu/Desktop/fnow/admin-worker/fwhyadmin`
- **Version Control:** This subfolder is a **separate Git repository**. Changes here must be committed and pushed independently.
- **Configuration:** Manages its own Wrangler configuration via `admin-worker/fwhyadmin/wrangler.jsonc`. The `wrangler.toml` file in this directory should be considered deprecated or removed to avoid confusion. The `admin` environment for deployment is defined within this `wrangler.jsonc`.
- **Dependencies:** Manages its own Node.js dependencies via `admin-worker/fwhyadmin/package.json`.

### 6.2. `wrangler.jsonc` Configurations

#### Root `wrangler.jsonc` (Key Snippet for `dev_frontend` environment)
Located at `/home/jeltu/Desktop/fnow/wrangler.jsonc`
```jsonc
// ... (structure for dev_frontend environment) ...
{
  "env": {
    "dev_frontend": {
      "name": "fwhy-dev-front",
      "main": "src/index.js", // Or appropriate entry point for frontend worker
      "site": { 
        "bucket": "./" // Or appropriate static asset directory
      },
      "routes": [
        { "pattern": "dev.farewellcafe.com/*", "zone_name": "farewellcafe.com" }
      ]
      // ... other vars and bindings for frontend ...
    }
  }
}
```

#### Admin Worker `wrangler.jsonc` (Key Snippet for `admin` environment)
Located at `/home/jeltu/Desktop/fnow/admin-worker/fwhyadmin/wrangler.jsonc`
```jsonc
{
  "name": "fwhy-admin", // Or the specific name for the admin worker service
  "main": "src/index.ts", // Entry point for the admin worker
  "compatibility_date": "YYYY-MM-DD", // Set appropriate date
  "env": {
    "admin": {
      // This environment will be used for `wrangler deploy --env admin`
      "vars": {
        "ENVIRONMENT": "production"
        // Add R2_PUBLIC_URL_PREFIX here if applicable
      },
      "kv_namespaces": [
        { "binding": "EVENTS_KV", "id": "464d611d5ad8433cab6bcfba64d8424f" },
        { "binding": "SESSIONS_KV", "id": "2038b95e785545af8486bc353c3cbe62" },
        { "binding": "GALLERY_KV", "id": "3cd37bd71260436c8ed12078483e9fa4" },
        { "binding": "BLOG_KV", "id": "6ee9ab6b71634a4eb3e66de82d8dfcdc" },
        { "binding": "CONFIG_KV", "id": "d54801ef0fb0443e850ee532ad1384b6" }
        // Ensure EVENTS_FAREWELL & EVENTS_HOWDY are here if migration handler needs them
      ],
      "d1_databases": [
        { "binding": "UNIFIED_DB", "database_name": "fwhy_uni_db", "database_id": "4f9ac7d3-ff64-45f5-a538-d8eb3b978f41" }
      ],
      "r2_buckets": [
        { "binding": "BLOG_IMAGES_R2", "bucket_name": "fwhy-blog-images" }
      ]
      // Secrets should be added via `wrangler secret put ADMIN_PASSWORD_HASH`
      // Routes for admin.farewellcafe.com/* should be defined here or at top level
    }
  },
  "routes": [ // Or define routes within the env.admin block if preferred
    { "pattern": "admin.farewellcafe.com/*", "zone_name": "farewellcafe.com" }
  ]
}
```
**Note on `ADMIN_PASSWORD_HASH_PLAINTEXT_FOR_SETUP_ONLY`**: This is only for initial local development if direct secret access is tricky. For production and standard development, always use `wrangler secret put ADMIN_PASSWORD_HASH` and remove the unsafe binding.

## 6.3. Deployment Commands

- **Admin Worker (from `/home/jeltu/Desktop/fnow/admin-worker/fwhyadmin` directory):**
    1. `npm install` (to ensure dependencies are up to date)
    2. `wrangler deploy --env admin` (uses `admin-worker/fwhyadmin/wrangler.jsonc`)

- **Frontend Worker/Pages (from `/home/jeltu/Desktop/fnow` directory):**
    1. `wrangler deploy --env dev_frontend` (uses `/home/jeltu/Desktop/fnow/wrangler.jsonc`)

### 6.4. Development Workflow

1. **Branching:** Use feature branches (e.g., `feature/event-flyers`, `fix/blog-slug-generation`).
2. **Commits:** Follow conventional commit message format (e.g., `feat: add event flyer upload to admin`).
3. **Local Development:** Use `wrangler dev` for the admin worker.
4. **Testing:** Implement unit/integration tests where possible.
5. **Pull Requests:** Use PRs for code review before merging to main/production branch.

## 7. Key Decisions & Open Questions Log

* **R2 Public URL Prefix:** **CONFIRMED:** `https://fwhy-bimg.farewellcafe.com`. This will be used for generating public URLs for images and flyers stored in the `fwhy-blog-images` R2 bucket.
* **Migration of Local Event Flyers:** A strategy is needed if many old event flyers are stored as local file paths (worker migration can only fetch HTTP URLs).
* **Howdy Thrift SPA:** Status and priority to be confirmed.
* **Detailed Schemas for Menu/Hours:** To be defined in Phase 2.

---

*This document is a living guide and should be updated as the project evolves.*

### Legacy Data Sources & Migration Plan

This section details original data sources and the plan for migrating them to the unified system.

*   **`EVENTS_KV` (KV Namespace ID: `03d1c47e68f04244927e60700ab9af2f`)**
    *   Original source for event listings and flyers.
    *   **Migration Plan:**
        *   Event data (name, date, description, time, price, flyer_filename) to be migrated to the `events` table in `UNIFIED_DB`.
        *   Flyer images to be uploaded to `R2_BLOG_IMAGES` (`fwhy-bimg`).
        *   `events.flyer_url` in `UNIFIED_DB` to store the R2 URL.
        *   **Status:** Pending. Handler `eventMigration.ts` to be developed/used.
*   **`BLOG_KV` (KV Namespace ID: `6ee9ab6b71634a4eb3e66de82d8dfcdc`)**
    *   Initially thought to be the source for blog posts.
    *   **Migration Plan:** This KV appears to be empty. Investigation shifted.
    *   **Status:** Empty. No migration planned from this KV.
*   **`BL0WKV_MIGRATION` (KV Namespace ID: `f00909997a054378bb051e239968900c`)**
    *   Bound for investigation as a potential legacy blog KV.
    *   **Migration Plan:** This KV also appears to be empty.
    *   **Status:** Empty. No migration planned from this KV.
*   **`BL0WD1_MIGRATION` (D1 Database ID: `05f0ba39-50bd-433a-90a6-360134562991`, bound as `BL0WD1_MIGRATION` in admin worker)
    *   Suspected original source for blog posts or other structured data.
    *   **Migration Plan:**
        *   Blog post data (title, content, author, date, image_filename) to be migrated to the `blog_posts` table in `UNIFIED_DB`.
        *   Blog images (e.g., `community_garden_poster.jpeg`, `pizza_pizza.jpeg`, `tshirts_4sale.jpeg`, `HOWDYTHRIFT.jpg`) to be uploaded to `R2_BLOG_IMAGES` (`fwhy-bimg`).
        *   `blog_posts.image_url` in `UNIFIED_DB` to store the R2 URL.
        *   `blog_posts.slug` to be generated.
    *   **Status:** **Currently under investigation.** Binding added to `admin-worker/fwhyadmin/wrangler.jsonc`. Next step is to query this database.
*   **Local Image Files (various locations, primarily project root for blog images):**
    *   Blog images: `community_garden_poster.jpeg`, `pizza_pizza.jpeg`, `tshirts_4sale.jpeg`, `HOWDYTHRIFT.jpg` (located in `/home/jeltu/Desktop/fnow/`).
    *   Event flyers: (Locations to be confirmed, likely referenced in `EVENTS_KV`).
    *   **Migration Plan:**
        *   Blog images: Match to migrated blog posts, upload to R2, update `blog_posts.image_url`.
        *   Event flyers: Match to migrated events, upload to R2, update `events.flyer_url`.
    *   **Status:** Blog images identified. Flyer image migration pending event data extraction.

#### `admin-worker/fwhyadmin/wrangler.jsonc` Configuration

Key bindings for the admin worker:

*   `UNIFIED_DB`: Primary D1 database (`fwhy_uni_db`) for all unified data (blog, events, menu, etc.).
*   `R2_BLOG_IMAGES`: R2 bucket (`fwhy-bimg`) for all images (blog, flyers, gallery).
*   `R2_PUBLIC_URL_PREFIX`: Variable set to `https://fwhy-bimg.farewellcafe.com`.
*   `EVENTS_KV`: Legacy KV for event data migration.
*   `BLOG_KV`: Legacy KV for blog data (found to be empty).
*   `BL0WKV_MIGRATION`: Legacy KV for blog data investigation (found to be empty).
*   `BL0WD1_MIGRATION`: Legacy D1 database (`bl0wd1`) for blog data investigation.
*   Other KVs (`SESSIONS_KV`, `GALLERY_KV`, `CONFIG_KV`) for their respective functionalities.
