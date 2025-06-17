we'# Frontend Asset and JS File Audit

## Summary
This audit documents which directories, JS files, and assets are actually being loaded and used by the frontend HTML entry points.

## HTML Entry Points and Their Dependencies

### 1. Main Site Entry Points

#### `/index.html` (Main homepage)
**Loaded Scripts:**
- `./jss/gsap-public/minified/gsap.min.js`
- `./jss/gsap-public/minified/ScrollTrigger.min.js`
- `./jss/gsap-public/minified/MotionPathPlugin.min.js`
- `./jss/gsap-public/minified/CustomEase.min.js`
- `./jss/ifrevl.js` (defer)
- `./jss/ansik.js` (defer)
- `./jss/script.js` (loaded at bottom)

**Loaded CSS:**
- `./css/ccssss.css`

**Embedded iFrame:**
- `./u/index.html` (newsletter/blog section)

#### `/howdy.htm` (Howdy-specific page)
**Loaded Scripts:**
- All GSAP files (same as index.html)
- `./jss/ansik.js` (defer)
- `./jss/script.js` (defer)

**Loaded CSS:**
- `./css/ccssss.css`

#### `/about.htm`, `/more.htm`, `/booking.htm` (Static pages)
**Loaded Scripts:**
- All GSAP files (same as index.html)
- `./jss/ansik.js` (defer)
- `./jss/script.js` (defer)

**Loaded CSS:**
- `./css/ccssss.css`

### 2. Special Purpose Pages

#### `/batch-simple.htm` (Batch uploader)
**Loaded Scripts:**
- `./jss/batch-upload-simplified.js`

**Loaded CSS:**
- `./css/ccssss.css`

#### `/u/index.html` (Newsletter/Blog interface)
**Loaded Scripts:**
- `https://cdn.quilljs.com/1.3.7/quill.js` (external)
- `./news.js`

**Loaded CSS:**
- `../css/ccssss.css`
- `./news.css`
- `https://cdn.quilljs.com/1.3.7/quill.snow.css` (external)

#### `/menu/index.html` (Food menu)
**Loaded Scripts:**
- None (pure CSS/HTML)

**Loaded CSS:**
- Inline styles only (font-face declarations for local fonts)

#### `/howdythrift/index.html` (Thrift-related page)
**Loaded Scripts:**
- `./jss/gsap-public/minified/gsap.min.js`
- Inline script only

**Loaded CSS:**
- `./css/ccssss.css`

#### `/404.html` (Error page)
**Loaded Scripts:**
- None

**Loaded CSS:**
- `./css/ccssss.css`

#### `/upload_tutorial.html` (Upload tutorial)
**Loaded Scripts:**
- Inline script only

**Loaded CSS:**
- None explicitly referenced

## Currently Used Assets

### JavaScript Files (ACTIVELY LOADED)
```
/jss/gsap-public/minified/
├── gsap.min.js ✅ (used by main pages)
├── ScrollTrigger.min.js ✅ (used by main pages)
├── MotionPathPlugin.min.js ✅ (used by main pages)
└── CustomEase.min.js ✅ (used by main pages)

/jss/
├── script.js ✅ (main frontend logic)
├── ifrevl.js ✅ (used by index.html only)
├── ansik.js ✅ (used by main pages)
├── batch-upload-simplified.js ✅ (used by batch-simple.htm)

/u/
└── news.js ✅ (used by newsletter interface)
```

### CSS Files (ACTIVELY LOADED)
```
/css/
├── ccssss.css ✅ (main stylesheet used by all pages)

/u/
└── news.css ✅ (used by newsletter interface)
```

### Font Files (ACTIVELY USED)
Both `/fnt/` and `/css/fnt/` contain the same fonts. Only one directory is needed:
```
Font files (duplicated in /fnt/ and /css/fnt/):
├── db.woff2 ✅
├── ds.woff2 ✅
├── hnb2.woff2 ✅
├── hnbi4.woff2 ✅
├── hnm11.woff2 ✅
├── hnmi12.woff2 ✅
├── kb.woff2 ✅
└── mrt.woff2 ✅
```

## Unused/Legacy Files

### JavaScript Files (NOT LOADED BY FRONTEND)
```
/jss/
├── batch-upload-legacy.js ❌ (old version)
├── batch-upload-old.js ❌ (old version)
├── batch-upload.js ❌ (superseded by simplified version)
├── script-broken.js ❌ (backup/broken version)
├── modal.js ❌ (commented out in index.html)
├── blog-worker.js ❌ (backend worker, not frontend)
├── current_gallery_worker.js ❌ (backend worker, not frontend)
├── eventswrkr.js ❌ (backend worker, not frontend)
├── unified-events-worker.js ❌ (backend worker, not frontend)

Files/Directories:
├── batch.htm ❌ (empty file)
├── batchintegratestruct ❌ (unknown file)
├── ifrevoalds ❌ (unknown file)
└── New Folder/ ❌ (empty directory)
```

### CSS Files (NOT LOADED BY FRONTEND)
```
/css/
├── 3ccssss.css ❌ (not referenced)
└── ccssss2.css ❌ (not referenced)
```

### Other Files
```
Empty or unused HTML files:
├── /batch.htm ❌ (empty)
└── /jss/batch.htm ❌ (misplaced, likely old)
```

## Duplicate Assets

### Font Files
The same font files exist in both `/fnt/` and `/css/fnt/`. Only one location is needed.

## Recommendations

### Immediate Cleanup (Safe to Remove)
1. **Remove unused JS files:**
   - `/jss/batch-upload-legacy.js`
   - `/jss/batch-upload-old.js`
   - `/jss/batch-upload.js`
   - `/jss/script-broken.js`
   - `/jss/blog-worker.js` (move to backend)
   - `/jss/current_gallery_worker.js` (move to backend)
   - `/jss/eventswrkr.js` (move to backend)
   - `/jss/batch.htm`
   - `/jss/batchintegratestruct`
   - `/jss/ifrevoalds`
   - `/jss/New Folder/`

2. **Remove unused CSS files:**
   - `/css/3ccssss.css`
   - `/css/ccssss2.css`

3. **Remove empty HTML files:**
   - `/batch.htm` (empty file)

4. **Consolidate font directories:**
   - Keep either `/fnt/` or `/css/fnt/` (recommend `/fnt/`)
   - Update CSS references if needed

### Backend Worker Consolidation
Move backend workers to a separate directory or repository:
- `unified-events-worker.js`
- `blog-worker.js`
- `current_gallery_worker.js`
- `eventswrkr.js`

### File Organization
```
Recommended structure:
/
├── index.html
├── [other .htm pages]
├── css/
│   └── ccssss.css
├── js/
│   ├── script.js
│   ├── ifrevl.js
│   ├── ansik.js
│   ├── batch-upload-simplified.js
│   └── gsap-public/
├── fnt/
│   └── [font files]
├── img/
│   └── [image files]
├── u/
│   ├── index.html
│   ├── news.js
│   └── news.css
└── menu/
    └── index.html
```

## Notes
- The `modal.js` file is commented out in `index.html` but still exists
- Backend workers should be moved to separate deployment/repository
- All main pages use the same set of GSAP libraries and core JS files
- Only `index.html` uses `ifrevl.js`
