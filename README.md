# Farewell & Howdy Website

A dynamic dual-venue website for Farewell and Howdy venues in Kansas City, Missouri. Built as a Cloudflare Worker with static asset serving and unified events management.

## Recent Major Updates (June 2025)

### ✅ Completed Migration & Integration
- **Cloudflare Worker Migration**: Successfully migrated from Cloudflare Pages to Worker with static asset serving
- **Newsletter System**: Replaced MailChimp with Kit (ConvertKit) integration
- **Simplified Batch Upload**: Removed AI/OCR features, implemented manual event entry system
- **Unified Events System**: Integrated flyer thumbnails, suggested pricing, and ticket links with deduplication

### Key Features

#### 1. Dual-Venue Experience
- Toggle between Farewell and Howdy venues with dynamic content switching
- Venue-specific images, social links, calendars, and event listings
- State-aware routing and content display

#### 2. Event Management System
- **Unified Events API**: Central endpoint for event aggregation and deduplication
- **Flyer Integration**: Thumbnail support with original flyer display
- **Enhanced Event Data**: Suggested pricing, ticket links, venue info, and descriptions
- **Smart Deduplication**: Merges duplicate events from multiple sources
- **Venue Filtering**: Separate listings for Farewell and Howdy shows

#### 3. Simplified Batch Upload
- **Manual Entry System**: Clean interface without AI/OCR complexity  
- **Multiple File Upload**: Batch process multiple flyers with individual event details
- **Required Fields**: Title, date, and venue with optional pricing and ticket links
- **Real-time Validation**: Form validation and success/error feedback
- **Integrated Storage**: Direct integration with unified events database

#### 4. Newsletter Integration
- **Kit (ConvertKit) Form**: Custom-styled form matching site design
- **Form ID**: `8151329` (configured for production)
- **Success/Error Handling**: User-friendly response messages
- **State-aware Signup**: Context-aware newsletter subscription

#### 5. Popup System & Navigation
- **Event Listings Popup**: Dynamic popup showing upcoming shows with thumbnails
- **Calendar Integration**: .ics file download and Google Calendar integration
- **Social Media Links**: Venue-specific social media integration
- **Mobile Responsive**: Optimized for all device sizes

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Run locally:
```bash
npm run dev
```

3. Preview with local mode:
```bash
npm run preview
```

## Deployment

### Prerequisites

1. Install Wrangler CLI globally (if not already done):
```bash
npm install -g wrangler
```

2. Authenticate with Cloudflare:
```bash
wrangler auth
```

### Deploy to Production

To deploy to `dev.farewellcafe.com`:

```bash
npm run deploy:production
```

### Deploy to Development

For testing purposes:

```bash
npm run deploy
```

## Configuration

The `wrangler.toml` file contains the configuration:

- **Production environment**: Routes to `dev.farewellcafe.com/*`
- **Compatibility date**: May 20, 2025
- **Static assets**: Served from the root directory

## Custom 404 Page

The worker includes a custom 404 page that:
- Matches the site's visual design and branding
- Uses the same fonts and color scheme
- Includes navigation back to the main site
- Has GSAP animations for consistency
- Shows a friendly, on-brand error message

## File Structure

```
├── src/
│   └── index.js          # Main Worker script
├── css/                  # Stylesheets
├── jss/                  # JavaScript files
├── img/                  # Images
├── fnt/                  # Fonts
├── menu/                 # Menu assets
├── u/                    # User directory
├── *.htm                 # HTML pages
├── 404.html             # Custom 404 page
├── wrangler.toml        # Cloudflare Worker config
└── package.json         # Dependencies and scripts
```

## Migration from Pages

This worker replaces the previous Cloudflare Pages deployment by:

1. Using `@cloudflare/kv-asset-handler` to serve static files
2. Implementing custom routing logic for .htm files
3. Adding a custom 404 handler
4. Maintaining all original functionality while adding Worker benefits

## Monitoring

View logs in real-time:
```bash
npm run tail
```

## Environment Variables

Currently no environment variables are configured, but they can be added to `wrangler.toml` under the `[vars]` section if needed.

## Secrets

If you need to add secrets, use:
```bash
wrangler secret put SECRET_NAME
```

Then reference them in the `wrangler.toml` file under the `[secrets]` section.
