/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing for the admin worker
 */

export async function corsMiddleware(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = (env.CORS_ORIGINS || '').split(',').map(o => o.trim());
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const headers = new Headers();
    
    // Set CORS headers
    if (origin && allowedOrigins.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    } else {
      headers.set('Access-Control-Allow-Origin', '*');
    }
    
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    headers.set('Access-Control-Max-Age', '86400');
    
    return new Response(null, { status: 204, headers });
  }

  // For non-preflight requests, return null to continue processing
  return null;
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(response, request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = (env.CORS_ORIGINS || '').split(',').map(o => o.trim());
  
  const headers = new Headers(response.headers);
  
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
