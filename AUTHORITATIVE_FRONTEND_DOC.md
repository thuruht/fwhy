# Farewell/Howdy Unified Frontend

## Overview

This is the authoritative documentation for the Farewell/Howdy unified frontend. It supersedes all previous frontend docs, plans, and status files. All other frontend documentation files can be archived or deleted.

---

## Features

- Modern, unified public site for Farewell and Howdy
- Robust state switching ("farewell"/"howdy")
- Unified event calendar and per-venue slideshows
- Dynamic blog/news integration (with Quill editor on admin)
- Responsive, accessible, and mobile-friendly design
- API-driven: all data from unified backend endpoints

---

## Directory Structure

- `index.html` — Main entry point
- `css/ccssss.css` — Main stylesheet
- `jss/script.js` — Main JS (state switching, API, slideshows)
- `img/` — Images, flyers, assets
- `fnt/` — Fonts
- `menu/` — Menu page and assets
- `u/` — News/blog frontend
- `about.htm`, `booking.htm`, `howdy.htm`, `more.htm` — Subpages

---

## API Usage

- All event, flyer, and blog/news data is fetched from the backend API documented in `AUTHORITATIVE_BACKEND_DOC.md`.
- No direct data storage in the frontend; all dynamic content is API-driven.

---

## State Switching

- Controlled by `jss/script.js` and the `data-state` attribute on `<body>`
- All UI, theming, and slideshows update based on state
- API calls use the current state (venue) as a parameter

---

## Blog/News

- Blog/news posts are rendered from API data
- Images are referenced by URL (never base64)
- Admin dashboard uses Quill with custom image upload

---

## Modern Practices

- No legacy config files (no TOML, no old build scripts)
- All config in `wrangler.jsonc` (for backend)
- Use only modern, supported browser APIs and CSS

---

## Quick Start

1. Deploy static files to Cloudflare Pages or similar
2. Ensure backend API is deployed and accessible
3. All dynamic content will load automatically from API

---

## Contact

For questions, see this file or the backend doc, or contact the project maintainer.

---

*This is the only authoritative frontend documentation. All other frontend docs can be archived.*
