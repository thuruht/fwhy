# 🚀 Farewell Cafe - Cloudflare Worker Migration Guide

## 📋 What This Migration Includes

✅ **Complete static site serving** - All your HTML, CSS, JS, images, and fonts  
✅ **Custom 404 error page** - Branded error page matching your site's design  
✅ **Route handling** - Proper handling of .htm files and all static assets  
✅ **Performance optimized** - Cloudflare Worker edge performance  
✅ **Easy deployment** - Simple commands to deploy to production  

## 🛠️ Setup Instructions

### 1. Install Wrangler CLI (if not already installed)
```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare
```bash
wrangler auth
```
This will open a browser window to authenticate with your Cloudflare account.

### 3. Dependencies are already installed, but if needed:
```bash
npm install
```

### 4. Test Locally
```bash
npm run dev
```
Your site will be available at `http://localhost:8787`

## 🌐 Deploy to Production

### Option 1: Use the deployment script (recommended)
```bash
./deploy.sh
```
This interactive script will guide you through the deployment process.

### Option 2: Direct commands

**Deploy to dev.farewellcafe.com:**
```bash
npm run deploy:production
```

**Deploy to development environment:**
```bash
npm run deploy
```

## 🔧 Configuration Details

### Custom Domain Setup
The `wrangler.toml` is configured to route `dev.farewellcafe.com/*` to your worker.

**Important:** Make sure your Cloudflare zone includes `farewellcafe.com` and that you have the necessary permissions.

### 404 Error Handling
- Custom 404 page at `/404.html`
- Fallback 404 generation in the Worker code
- Maintains your site's branding and design
- Includes navigation back to the main site

### File Structure After Migration
```
├── src/index.js          # 🔥 Main Cloudflare Worker script
├── wrangler.toml         # ⚙️  Worker configuration
├── package.json          # 📦 Dependencies and scripts
├── 404.html             # 🚫 Custom error page
├── deploy.sh            # 🚀 Deployment helper script
├── README.md            # 📖 This guide
├── .gitignore           # 🙈 Git ignore rules
└── [all your existing files remain unchanged]
```

## 🎯 Key Features

### Static Asset Serving
The Worker automatically handles:
- HTML files (including .htm extensions)
- CSS stylesheets
- JavaScript files
- Images (PNG, JPG, SVG, etc.)
- Fonts (WOFF2, WOFF, TTF)
- All files in css/, jss/, img/, fnt/, menu/, u/ directories

### Smart Routing
- Root path `/` serves `index.html`
- All .htm files work as expected
- Static assets are served with proper MIME types
- 404s show your custom branded error page

### Performance Benefits
- Edge caching through Cloudflare's network
- Faster global response times
- Better reliability than traditional hosting

## 🔍 Monitoring & Debugging

**View real-time logs:**
```bash
npm run tail
```

**Local development with hot reload:**
```bash
npm run dev
```

## 🚨 Troubleshooting

### "Command not found: wrangler"
Install wrangler globally: `npm install -g wrangler`

### "Authentication error"
Run: `wrangler auth` and complete the browser authentication

### "Zone not found"
Make sure `farewellcafe.com` is added to your Cloudflare account

### 404 page not showing custom design
Check that `404.html` exists and the CSS files are being served correctly

## 🎨 Customizing the 404 Page

The 404 page (`404.html`) uses your existing CSS and maintains the site's branding. You can customize:
- Error message text
- Styling and animations
- Additional navigation links
- Call-to-action buttons

## 📈 Next Steps

1. **Test thoroughly** - Visit various pages and test 404 scenarios
2. **Update DNS** - Point `dev.farewellcafe.com` to your Worker if needed
3. **Monitor performance** - Use Cloudflare Analytics to track performance
4. **Set up alerts** - Configure notifications for errors or performance issues

## 🔒 Security & Best Practices

- No sensitive data is exposed in the Worker code
- All static assets are served securely
- HTTPS is enforced by default through Cloudflare
- Rate limiting and DDoS protection are handled by Cloudflare

---

**Need help?** Check the Cloudflare Workers documentation or contact support.
