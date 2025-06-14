/**
 * Cloudflare Worker for Farewell Cafe website
 * Serves static files and handles 404 errors with custom page
 */

import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler';

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false;

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event));
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        }),
      );
    }
    event.respondWith(new Response('Internal Error', { status: 500 }));
  }
});

async function handleEvent(event) {
  const url = new URL(event.request.url);
  let options = {};

  /**
   * You can add custom logic to how we fetch your assets
   * by configuring the function `mapRequestToAsset`
   */
  // options.mapRequestToAsset = handlePrefix(/^\/docs/)

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      };
    }

    // Handle specific routes
    if (url.pathname === '/') {
      // Serve index.html for root path
      return await getAssetFromKV(event, {
        ...options,
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req),
      });
    }

    // Handle .htm files (your site uses .htm extensions)
    if (url.pathname.endsWith('.htm')) {
      return await getAssetFromKV(event, options);
    }

    // Handle static assets (CSS, JS, images, fonts)
    if (url.pathname.startsWith('/css/') || 
        url.pathname.startsWith('/jss/') || 
        url.pathname.startsWith('/img/') || 
        url.pathname.startsWith('/fnt/') ||
        url.pathname.startsWith('/menu/') ||
        url.pathname.startsWith('/u/') ||
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.jpeg') ||
        url.pathname.endsWith('.gif') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.woff') ||
        url.pathname.endsWith('.ttf') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.html')) {
      return await getAssetFromKV(event, options);
    }

    const page = await getAssetFromKV(event, options);
    
    // Let KV handle normal asset serving
    return page;

  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req =>
            new Request(`${new URL(req.url).origin}/404.html`, req),
        });

        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 404,
        });
      } catch (e) {
        // If 404.html is not found, return a basic 404 response
        return new Response(generate404Page(url.pathname), {
          status: 404,
          headers: {
            'content-type': 'text/html; charset=UTF-8',
          },
        });
      }
    }

    return new Response(e.message || e.toString(), { status: 500 });
  }
}

/**
 * Generate a custom 404 page that matches the site's design
 */
function generate404Page(pathname) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <title>404 - Page Not Found | FAREWELL CAFE</title>
    <link rel="icon" type="image/x-icon" href="./img/favicon.png">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="utf-8">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="./css/ccssss.css">
    
    <style>
        .not-found-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 70vh;
            text-align: center;
            padding: var(--padding-large);
        }
        
        .not-found-title {
            font-family: var(--font-main);
            font-size: 4rem;
            color: var(--accent-color);
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px var(--header-text-shadow);
        }
        
        .not-found-message {
            font-family: var(--font-secondary);
            font-size: 1.2rem;
            color: var(--text-color);
            margin-bottom: 2rem;
            max-width: 600px;
        }
        
        .not-found-path {
            font-family: monospace;
            background: rgba(0, 0, 0, 0.1);
            padding: 0.5rem 1rem;
            border-radius: 4px;
            margin-bottom: 2rem;
            word-break: break-all;
        }
        
        .home-link {
            display: inline-block;
            padding: 1rem 2rem;
            background: var(--button-bg-color);
            color: var(--button-text-color);
            text-decoration: none;
            font-family: var(--font-main);
            font-weight: bold;
            border-radius: 4px;
            transition: all var(--transition-speed) ease;
            border: 2px solid var(--text-color);
        }
        
        .home-link:hover {
            background: var(--accent-color);
            color: white;
            transform: translateY(-2px);
        }
        
        body[data-state="farewell"] {
            background: var(--header-bg);
        }
        
        .error-animation {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    </style>
</head>

<body data-state="farewell">
    <header class="feader" style="min-height:212px;">
        <div class="contain">
            <div class="left">
                <nav>
                    <ul>
                        <li><a href="./booking.htm">BOOKING</a></li>
                        <li><a href="./more.htm">MORE</a></li>
                        <li><a href="./about.htm">ABOUT</a></li>
                    </ul>
                </nav>
            </div>
            <div class="right">
                <h1 class="header-title">
                    <span class="span2">FAREWELL</span>
                    <span class="sulk drop-wiggle"> & HOWDY</span>
                </h1>
            </div>
        </div>
    </header>

    <main>
        <div class="not-found-container">
            <div class="error-animation">
                <h1 class="not-found-title">404</h1>
            </div>
            <p class="not-found-message">
                Oops! The page you're looking for seems to have wandered off like a lost soul at a farewell party.
            </p>
            <div class="not-found-path">
                Requested path: ${pathname}
            </div>
            <a href="/" class="home-link">TAKE ME HOME</a>
        </div>
    </main>

    <!-- Include the same JS as main site for consistency -->
    <script src="./jss/gsap-public/minified/gsap.min.js"></script>
    <script>
        // Simple animation for the 404 page
        if (typeof gsap !== 'undefined') {
            gsap.from('.not-found-container', {
                duration: 1,
                y: 50,
                opacity: 0,
                ease: 'back.out(1.7)'
            });
        }
    </script>
</body>
</html>`;
}

/**
 * Here's one example of how to modify a request to
 * remove a specific prefix, in this case `/docs` from
 * the url. This can be useful if you are deploying to a
 * route on a zone, or if you only want your static content
 * to exist at a specific path.
 */
// function handlePrefix(prefix) {
//   return request => {
//     // compute the default (e.g. / -> index.html)
//     let defaultAssetKey = mapRequestToAsset(request)
//     let url = new URL(defaultAssetKey.url)

//     // strip the prefix from the path for lookup
//     url.pathname = url.pathname.replace(prefix, '/')

//     // inherit all other props from the default request
//     return new Request(url.toString(), defaultAssetKey)
//   }
// }
