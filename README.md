# Farewell Cafe - Cloudflare Worker

This repository contains the Farewell Cafe website migrated from Cloudflare Pages to Cloudflare Workers.

## Features

- ✅ Serves all static assets (HTML, CSS, JS, images, fonts)
- ✅ Custom 404 error page that matches the site design
- ✅ Handles .htm file extensions
- ✅ Proper MIME type handling for all assets
- ✅ Optimized caching and performance

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
