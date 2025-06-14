/**
 * Authentication Middleware
 * Handles admin authentication for protected endpoints
 */

/**
 * Simple token-based authentication middleware
 * In production, this should be replaced with proper OAuth or JWT
 */
export async function authMiddleware(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ 
      error: 'Unauthorized', 
      message: 'Missing or invalid authorization header' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  // In production, validate token against a secure store
  // For now, use environment variable for admin token
  const adminToken = env.ADMIN_TOKEN || 'admin-dev-token';
  
  if (token !== adminToken) {
    return new Response(JSON.stringify({ 
      error: 'Unauthorized', 
      message: 'Invalid authentication token' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Authentication successful, continue to handler
  return null;
}

/**
 * Generate admin authentication token
 * This is a simplified implementation for development
 */
export function generateAdminToken(username, password, env) {
  // In production, this should use proper hashing and JWT
  const adminUser = env.ADMIN_USERNAME || 'admin';
  const adminPass = env.ADMIN_PASSWORD || 'admin123';
  
  if (username === adminUser && password === adminPass) {
    return env.ADMIN_TOKEN || 'admin-dev-token';
  }
  
  return null;
}

/**
 * Admin login handler
 */
export async function handleAdminLogin(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { username, password } = await request.json();
    
    const token = generateAdminToken(username, password, env);
    
    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'Invalid credentials' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      token,
      message: 'Login successful' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Invalid request body' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
