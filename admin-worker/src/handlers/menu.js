/**
 * Menu Handler
 * Manages drink menu items for both Farewell and Howdy venues
 */

import { addCorsHeaders } from '../middleware/cors.js';

export async function menuHandler(request, env, ctx, options = {}) {
  const { isPublic = false, isAdmin = false } = options;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  try {
    let response;

    if (isPublic) {
      response = await handlePublicMenuAPI(request, env, pathParts);
    } else if (isAdmin) {
      response = await handleAdminMenuAPI(request, env, pathParts);
    } else {
      response = new Response('Forbidden', { status: 403 });
    }

    return addCorsHeaders(response, request, env);

  } catch (error) {
    console.error('Menu handler error:', error);
    const errorResponse = new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return addCorsHeaders(errorResponse, request, env);
  }
}

/**
 * Handle public menu API endpoints
 */
async function handlePublicMenuAPI(request, env, pathParts) {
  const method = request.method;
  
  // GET /api/public/menu?venue=farewell
  // GET /api/public/menu/farewell
  if (method === 'GET') {
    const url = new URL(request.url);
    const venue = url.searchParams.get('venue') || pathParts[3];
    
    if (!venue || !['farewell', 'howdy'].includes(venue)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid venue parameter. Must be "farewell" or "howdy"' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const menuItems = await getMenuItems(env, venue);
    
    return new Response(JSON.stringify({
      venue,
      items: menuItems,
      lastUpdated: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405 });
}

/**
 * Handle admin menu API endpoints
 */
async function handleAdminMenuAPI(request, env, pathParts) {
  const method = request.method;
  
  // GET /api/admin/menu - Get all menu items
  // GET /api/admin/menu?venue=farewell - Get venue-specific items
  if (method === 'GET') {
    const url = new URL(request.url);
    const venue = url.searchParams.get('venue');
    
    if (venue && !['farewell', 'howdy'].includes(venue)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid venue parameter' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const menuItems = await getMenuItems(env, venue);
    
    return new Response(JSON.stringify({
      items: menuItems,
      total: menuItems.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // POST /api/admin/menu - Create new menu item
  if (method === 'POST') {
    const menuItem = await request.json();
    const result = await createMenuItem(env, menuItem);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 201 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // PUT /api/admin/menu/:id - Update menu item
  if (method === 'PUT' && pathParts[3]) {
    const itemId = pathParts[3];
    const updates = await request.json();
    const result = await updateMenuItem(env, itemId, updates);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // DELETE /api/admin/menu/:id - Delete menu item
  if (method === 'DELETE' && pathParts[3]) {
    const itemId = pathParts[3];
    const result = await deleteMenuItem(env, itemId);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405 });
}

/**
 * Get menu items from KV storage
 */
async function getMenuItems(env, venue = null) {
  try {
    const allItems = await env.MENU.list();
    const items = [];

    for (const key of allItems.keys) {
      if (key.name.startsWith('menu_item_')) {
        const item = await env.MENU.get(key.name, 'json');
        if (item && (!venue || item.venue === venue)) {
          items.push(item);
        }
      }
    }

    // Sort by category and name
    return items.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
}

/**
 * Create new menu item
 */
async function createMenuItem(env, menuItem) {
  try {
    // Validate required fields
    const required = ['name', 'venue', 'category', 'price'];
    for (const field of required) {
      if (!menuItem[field]) {
        return { 
          success: false, 
          error: `Missing required field: ${field}` 
        };
      }
    }

    // Validate venue
    if (!['farewell', 'howdy'].includes(menuItem.venue)) {
      return { 
        success: false, 
        error: 'Invalid venue. Must be "farewell" or "howdy"' 
      };
    }

    // Generate unique ID
    const id = generateMenuItemId();
    
    const newItem = {
      id,
      name: menuItem.name.trim(),
      venue: menuItem.venue,
      category: menuItem.category.trim(),
      description: menuItem.description?.trim() || '',
      price: parseFloat(menuItem.price),
      available: menuItem.available !== false,
      featured: menuItem.featured === true,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    await env.MENU.put(`menu_item_${id}`, JSON.stringify(newItem));

    return { 
      success: true, 
      item: newItem 
    };

  } catch (error) {
    console.error('Error creating menu item:', error);
    return { 
      success: false, 
      error: 'Failed to create menu item' 
    };
  }
}

/**
 * Update existing menu item
 */
async function updateMenuItem(env, itemId, updates) {
  try {
    const existingItem = await env.MENU.get(`menu_item_${itemId}`, 'json');
    
    if (!existingItem) {
      return { 
        success: false, 
        error: 'Menu item not found' 
      };
    }

    // Validate venue if provided
    if (updates.venue && !['farewell', 'howdy'].includes(updates.venue)) {
      return { 
        success: false, 
        error: 'Invalid venue' 
      };
    }

    const updatedItem = {
      ...existingItem,
      ...updates,
      id: itemId, // Prevent ID changes
      updated: new Date().toISOString()
    };

    // Clean up fields
    if (updatedItem.name) updatedItem.name = updatedItem.name.trim();
    if (updatedItem.category) updatedItem.category = updatedItem.category.trim();
    if (updatedItem.description) updatedItem.description = updatedItem.description.trim();
    if (updatedItem.price) updatedItem.price = parseFloat(updatedItem.price);

    await env.MENU.put(`menu_item_${itemId}`, JSON.stringify(updatedItem));

    return { 
      success: true, 
      item: updatedItem 
    };

  } catch (error) {
    console.error('Error updating menu item:', error);
    return { 
      success: false, 
      error: 'Failed to update menu item' 
    };
  }
}

/**
 * Delete menu item
 */
async function deleteMenuItem(env, itemId) {
  try {
    const existingItem = await env.MENU.get(`menu_item_${itemId}`, 'json');
    
    if (!existingItem) {
      return { 
        success: false, 
        error: 'Menu item not found' 
      };
    }

    await env.MENU.delete(`menu_item_${itemId}`);

    return { 
      success: true, 
      message: 'Menu item deleted successfully' 
    };

  } catch (error) {
    console.error('Error deleting menu item:', error);
    return { 
      success: false, 
      error: 'Failed to delete menu item' 
    };
  }
}

/**
 * Generate unique menu item ID
 */
function generateMenuItemId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
