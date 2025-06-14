/**
 * Unified Admin Worker for Farewell & Howdy Venues
 * 
 * Consolidates all backend functionality:
 * - Events Management
 * - Gallery Management  
 * - Newsletter/Blog System
 * - Menu Management (NEW)
 * - Operating Hours Management (NEW)
 * - Admin Authentication
 */

import { eventsHandler } from './handlers/events.js';
import { galleryHandler } from './handlers/gallery.js';
import { blogHandler } from './handlers/blog.js';
import { menuHandler } from './handlers/menu.js';
import { hoursHandler } from './handlers/hours.js';
import { authMiddleware } from './middleware/auth.js';
import { corsMiddleware } from './middleware/cors.js';
import { adminUIHandler } from './handlers/admin-ui.js';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Apply CORS middleware
      const corsResponse = await corsMiddleware(request, env);
      if (corsResponse) return corsResponse;

      // Health check endpoint
      if (path === '/health') {
        return new Response(JSON.stringify({ 
          status: 'healthy', 
          version: env.API_VERSION || 'v1',
          timestamp: new Date().toISOString() 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Serve admin UI for root path
      if (path === '/' || path === '/admin' || path.startsWith('/admin/')) {
        return await adminUIHandler(request, env, ctx);
      }

      // API Routes
      if (path.startsWith('/api/')) {
        // Public API endpoints (no auth required)
        if (path.startsWith('/api/public/')) {
          return await handlePublicAPI(request, env, ctx, path);
        }

        // Admin API endpoints (auth required)
        if (path.startsWith('/api/admin/')) {
          const authResponse = await authMiddleware(request, env);
          if (authResponse) return authResponse;
          
          return await handleAdminAPI(request, env, ctx, path);
        }

        // Legacy API endpoints for backward compatibility
        return await handleLegacyAPI(request, env, ctx, path);
      }

      // Default 404
      return new Response('Not Found', { status: 404 });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Handle public API endpoints (no authentication required)
 */
async function handlePublicAPI(request, env, ctx, path) {
  const url = new URL(request.url);

  // Public events endpoints
  if (path.startsWith('/api/public/events')) {
    return await eventsHandler(request, env, ctx, { isPublic: true });
  }

  // Public menu endpoints  
  if (path.startsWith('/api/public/menu')) {
    return await menuHandler(request, env, ctx, { isPublic: true });
  }

  // Public hours endpoints
  if (path.startsWith('/api/public/hours')) {
    return await hoursHandler(request, env, ctx, { isPublic: true });
  }

  // Public blog/newsletter endpoints
  if (path.startsWith('/api/public/blog') || path.startsWith('/api/public/newsletter')) {
    return await blogHandler(request, env, ctx, { isPublic: true });
  }

  return new Response('Public endpoint not found', { status: 404 });
}

/**
 * Handle admin API endpoints (authentication required)
 */
async function handleAdminAPI(request, env, ctx, path) {
  // Events management
  if (path.startsWith('/api/admin/events')) {
    return await eventsHandler(request, env, ctx, { isAdmin: true });
  }

  // Gallery management
  if (path.startsWith('/api/admin/gallery')) {
    return await galleryHandler(request, env, ctx, { isAdmin: true });
  }

  // Blog/Newsletter management
  if (path.startsWith('/api/admin/blog') || path.startsWith('/api/admin/newsletter')) {
    return await blogHandler(request, env, ctx, { isAdmin: true });
  }

  // Menu management (NEW)
  if (path.startsWith('/api/admin/menu')) {
    return await menuHandler(request, env, ctx, { isAdmin: true });
  }

  // Operating hours management (NEW)
  if (path.startsWith('/api/admin/hours')) {
    return await hoursHandler(request, env, ctx, { isAdmin: true });
  }

  return new Response('Admin endpoint not found', { status: 404 });
}

/**
 * Handle legacy API endpoints for backward compatibility
 */
async function handleLegacyAPI(request, env, ctx, path) {
  const url = new URL(request.url);

  // Legacy events endpoints
  if (path.startsWith('/api/events') || path.startsWith('/list/')) {
    return await eventsHandler(request, env, ctx, { isLegacy: true });
  }

  // Legacy gallery endpoints
  if (path.startsWith('/api/gallery')) {
    return await galleryHandler(request, env, ctx, { isLegacy: true });
  }

  return new Response('Legacy endpoint not found', { status: 404 });
}
