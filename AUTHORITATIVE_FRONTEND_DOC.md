# AUTHORITATIVE_FRONTEND_DOC.md

## Unified Farewell/Howdy Frontend

### Features

- State switching (Farewell/Howdy) with dynamic theming and content
- Slideshow displays all event flyers for selected venue/state
- Clicking a flyer opens a modal with full event info (title, date, time, venue, price, age restriction, description, ticket link)
- No captions under slideshow images
- All event/flyer data comes from unified backend API (`/api/events/list` and `/api/events/slideshow`)
- Fully responsive, modern UI

### Event Data

- Expects each event to have: `title`, `date`, `time`, `venue`, `imageUrl` (from `thumbnail_url` or `flyer_url`), `description`, `suggestedPrice`, `ticketLink`, `ageRestriction`
- Modal popup shows all available info, including optional ticket purchase link
- All legacy and new events/flyers are visible (backend merges all sources)

### State Switching

- User can toggle between Farewell and Howdy; all content, images, and events update accordingly

### Interoperability

- Fully compatible with the new backend (fwhyadmin)
- All legacy event data from the old worker is preserved and visible
- No dependency on old endpoints, but backend can still import from them if needed

### Deployment

- Static site, served from Cloudflare Pages/Workers
- All config in `wrangler.jsonc`

---

_Last updated: 2025-06-17_
