// cloudflare-worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const ip = request.headers.get("cf-connecting-ip");
    const allowedOrigins = [
      'https://fwhy.kcmo.xyz',
      'https://kcmo.xyz', 
      'https://farewellcafe.com',
      'https://www.farewellcafe.com'
    ];

    // Security Headers Configuration
    const securityHeaders = {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' https://cdn.quilljs.com;
        style-src 'self' 'unsafe-inline' https://cdn.quilljs.com;
        img-src 'self' data: https://*.youtube.com https://bl0wr2.jojo-829.r2.cloudflarestorage.com;
        frame-src https://www.youtube.com;
        font-src 'self' https://farewellcafe.com data:;
        connect-src 'self' https://*.cloudflare.com;
        form-action 'self';
        base-uri 'self';
      `.replace(/\s+/g, ' ').trim(),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    // Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          ...securityHeaders,
          'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type'
        }
      });
    }

    // Main Request Handler
    try {
      // Posts Endpoints
      if (url.pathname.startsWith('/bl10g/posts')) {
        return handlePostsRequest(request, env, allowedOrigins, securityHeaders, ip);
      }

      // Featured Content Endpoints
      if (url.pathname.startsWith('/bl10g/featured')) {
        return handleFeaturedRequest(request, env, allowedOrigins, securityHeaders);
      }

      // Login Endpoint
      if (url.pathname.startsWith('/bl10g/login')) {
        return handleLogin(request, env, allowedOrigins, securityHeaders, ip);
      }

      // Health Check
      if (url.pathname === '/bl10g/health') {
        return new Response('OK', { 
          status: 200,
          headers: securityHeaders
        });
      }

      return new Response('Not Found', { 
        status: 404,
        headers: securityHeaders
      });

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Global Error: ${error.stack}`);
      return new Response(JSON.stringify({
        success: false,
        error: "Internal Server Error"
      }), {
        status: 500,
        headers: securityHeaders
      });
    }
  }
};

// Posts Request Handler
async function handlePostsRequest(request, env, allowedOrigins, securityHeaders, ip) {
  const origin = request.headers.get("Origin");
  const url = new URL(request.url);
  const headers = {
    ...securityHeaders,
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  };

  try {
    switch(request.method) {
      case 'GET': {
        const stmt = env.BLOG_DB.prepare(
          "SELECT id, title, content, image_url, created_at " +
          "FROM blog_posts ORDER BY created_at DESC"
        );
        const posts = await stmt.all();
        return new Response(JSON.stringify({ 
          success: true, 
          data: posts.results 
        }), {
          status: 200,
          headers
        });
      }

      case 'POST':
      case 'PUT': {
        const authHeader = request.headers.get('Authorization');
        const sessionToken = authHeader?.replace('Bearer ', '');
        if (!sessionToken || !await env.BLOG_KV.get(`session:${sessionToken}`)) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Unauthorized" 
          }), { 
            status: 401,
            headers
          });
        }

        const input = await request.json();
        if (!input?.title?.trim() || !input?.content?.trim()) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Title and content are required" 
          }), { 
            status: 400,
            headers
          });
        }

        if (request.method === 'POST') {
          const result = await env.BLOG_DB.prepare(
            "INSERT INTO blog_posts (title, content, image_url) " +
            "VALUES (?1, ?2, ?3)"
          ).bind(
            input.title.trim(),
            input.content.trim(),
            input.imageUrl?.trim() || null
          ).run();

          return new Response(JSON.stringify({
            success: true,
            data: { id: result.meta.last_row_id }
          }), {
            status: 201,
            headers
          });
        } else {
          if (!input.id || typeof input.id !== 'number') {
            return new Response(JSON.stringify({ 
              success: false, 
              error: "Valid post ID required" 
            }), { 
              status: 400,
              headers
            });
          }

          const result = await env.BLOG_DB.prepare(
            "UPDATE blog_posts SET title = ?1, content = ?2, image_url = ?3 " +
            "WHERE id = ?4"
          ).bind(
            input.title.trim(),
            input.content.trim(),
            input.imageUrl?.trim() || null,
            input.id
          ).run();

          if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: "Post not found" 
            }), { 
              status: 404,
              headers
            });
          }

          return new Response(JSON.stringify({
            success: true,
            data: { changes: result.meta.changes }
          }), {
            status: 200,
            headers
          });
        }
      }

      case 'DELETE': {
        const authHeader = request.headers.get('Authorization');
        const sessionToken = authHeader?.replace('Bearer ', '');
        if (!sessionToken || !await env.BLOG_KV.get(`session:${sessionToken}`)) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Unauthorized" 
          }), { 
            status: 401,
            headers
          });
        }

        const input = await request.json();
        if (!input?.id || typeof input.id !== 'number') {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Valid post ID required" 
          }), { 
            status: 400,
            headers
          });
        }

        const result = await env.BLOG_DB.prepare(
          "DELETE FROM blog_posts WHERE id = ?"
        ).bind(input.id).run();

        if (result.meta.changes === 0) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Post not found" 
          }), { 
            status: 404,
            headers
          });
        }

        return new Response(JSON.stringify({
          success: true,
          data: { changes: result.meta.changes }
        }), {
          status: 200,
          headers
        });
      }

      default:
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Method not allowed" 
        }), { 
          status: 405,
          headers
        });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Posts Error: ${error.stack}`);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Database operation failed" 
    }), { 
      status: 500,
      headers
    });
  }
}

// Featured Content Handler
async function handleFeaturedRequest(request, env, allowedOrigins, securityHeaders) {
  const origin = request.headers.get("Origin");
  const url = new URL(request.url);
  const headers = {
    ...securityHeaders,
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  };

  try {
    switch(request.method) {
      case 'GET': {
        const featuredData = await env.BLOG_KV.get("featured_info");
        return new Response(JSON.stringify({
          success: true,
          data: featuredData ? JSON.parse(featuredData) : {
            text: "Default featured content",
            youtubeUrl: null
          }
        }), {
          status: 200,
          headers
        });
      }

      case 'POST': {
        const authHeader = request.headers.get('Authorization');
        const sessionToken = authHeader?.replace('Bearer ', '');
        if (!sessionToken || !await env.BLOG_KV.get(`session:${sessionToken}`)) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Unauthorized" 
          }), { 
            status: 401,
            headers
          });
        }

        const input = await request.json();
        if (typeof input.text === 'undefined') {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Text content is required" 
          }), { 
            status: 400,
            headers
          });
        }

        await env.BLOG_KV.put("featured_info", JSON.stringify({
          text: input.text.trim(),
          youtubeUrl: input.youtubeUrl?.trim() || null
        }));

        return new Response(JSON.stringify({
          success: true,
          data: { message: "Featured content updated" }
        }), {
          status: 200,
          headers
        });
      }

      default:
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Method not allowed" 
        }), { 
          status: 405,
          headers
        });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Featured Error: ${error.stack}`);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Storage operation failed" 
    }), { 
      status: 500,
      headers
    });
  }
}

// Login Handler
async function handleLogin(request, env, allowedOrigins, securityHeaders, ip) {
  const origin = request.headers.get("Origin");
  const headers = {
    ...securityHeaders,
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  };

  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Method not allowed" 
      }), { 
        status: 405,
        headers
      });
    }

    // Rate limiting
    const loginAttempts = await env.RATE_LIMITER.limit({ key: `login:${ip}` });
    if (!loginAttempts.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Too many login attempts" 
      }), { 
        status: 429,
        headers: {
          ...headers,
          'Retry-After': loginAttempts.retryAfter
        }
      });
    }

    const { password } = await request.json();
    if (password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid credentials" 
      }), { 
        status: 401,
        headers
      });
    }

    const sessionToken = crypto.randomUUID();
    await env.BLOG_KV.put(`session:${sessionToken}`, "valid", {
      expirationTtl: 86400 // 24 hours
    });

    return new Response(JSON.stringify({
      success: true,
      data: { sessionToken }
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Login Error: ${error.stack}`);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Authentication failed" 
    }), { 
      status: 500,
      headers
    });
  }
}