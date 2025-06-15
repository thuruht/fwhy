// Enhanced Events Worker with Unified Listings and Flyer Integration
// This worker handles event aggregation, deduplication, and serves unified listings

import { DOMParser } from 'linkedom';

// External source URLs for event scraping
const SOURCE_URLS = [
  'https://www.shuttlecockmusic.com/p/kansas-city-area-show-list.html',
  'https://fygw0.kcmo.xyz/list/howdy',
  'https://fygw0.kcmo.xyz/list/farewell',
  'https://www.songkick.com/venues/4101119-farewell/calendar',
  'https://www.songkick.com/venues/4482636-howdy/calendar'
];

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }
    
    // Route handling
    switch (url.pathname) {
      case '/events':
        return handleEventsEndpoint(request, env);
      case '/events/unified':
        return handleUnifiedListing(request, env);
      case '/events/venue':
        return handleVenueListing(request, env);
      case '/events/refresh':
        return handleRefreshEvents(request, env);
      default:
        return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
    }
  },

  async scheduled(event, env, ctx) {
    // Scheduled task to refresh events from external sources
    return await refreshEventsFromSources(env);
  }
};

// Handle the main events endpoint (POST for creating, GET for listing)
async function handleEventsEndpoint(request, env) {
  if (request.method === 'POST') {
    return await createEvent(request, env);
  } else if (request.method === 'GET') {
    return await getEvents(request, env);
  }
  
  return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
}

// Create new event (from batch upload or manual entry)
async function createEvent(request, env) {
  try {
    const eventData = await request.json();
    
    // Validate required fields
    if (!eventData.title || !eventData.date || !eventData.venue) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, date, venue' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create event object with enhanced fields
    const event = {
      id: generateEventId(eventData),
      title: eventData.title,
      date: eventData.date,
      time: eventData.time || '',
      venue: eventData.venue,
      description: eventData.description || '',
      suggestedPrice: eventData.suggestedPrice || '',
      ticketLink: eventData.ticketLink || '',
      flyerUrl: eventData.flyerUrl || '',
      flyerThumbnail: eventData.flyerThumbnail || '',
      source: eventData.source || 'manual',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    // Check for duplicates and merge if necessary
    const existingEvents = await getEventsFromKV(env);
    const mergedEvents = mergeEventData(existingEvents, [event]);
    
    // Store updated events
    await env.EVENTS_KV.put('events_data', JSON.stringify(mergedEvents));
    
    return new Response(
      JSON.stringify({ success: true, event: event }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create event: ' + error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}

// Get events with filtering
async function getEvents(request, env) {
  try {
    const url = new URL(request.url);
    const venue = url.searchParams.get('venue');
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const includeFlyers = url.searchParams.get('includeFlyers') !== 'false';
    
    const events = await getEventsFromKV(env);
    
    // Filter by venue if specified
    let filteredEvents = venue 
      ? events.filter(event => event.venue === venue)
      : events;
    
    // Sort by date (upcoming first)
    filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Apply limit
    filteredEvents = filteredEvents.slice(0, limit);
    
    // Optionally exclude flyer data for lighter responses
    if (!includeFlyers) {
      filteredEvents = filteredEvents.map(event => {
        const { flyerUrl, flyerThumbnail, ...eventWithoutFlyers } = event;
        return eventWithoutFlyers;
      });
    }
    
    return new Response(
      JSON.stringify({ events: filteredEvents }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to get events: ' + error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}

// Handle unified listing for popup display
async function handleUnifiedListing(request, env) {
  try {
    const events = await getEventsFromKV(env);
    
    // Generate HTML for the popup
    const html = generateUnifiedListingHTML(events);
    
    return new Response(html, {
      headers: { ...CORS_HEADERS, 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    return new Response(
      `<html><body><p>Error loading events: ${error.message}</p></body></html>`,
      { headers: { ...CORS_HEADERS, 'Content-Type': 'text/html' } }
    );
  }
}

// Handle venue-specific listing
async function handleVenueListing(request, env) {
  try {
    const url = new URL(request.url);
    const venue = url.searchParams.get('venue') || 'farewell';
    
    const events = await getEventsFromKV(env);
    const venueEvents = events.filter(event => event.venue === venue);
    
    const html = generateVenueListingHTML(venueEvents, venue);
    
    return new Response(html, {
      headers: { ...CORS_HEADERS, 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    return new Response(
      `<html><body><p>Error loading ${venue} events: ${error.message}</p></body></html>`,
      { headers: { ...CORS_HEADERS, 'Content-Type': 'text/html' } }
    );
  }
}

// Manual refresh endpoint
async function handleRefreshEvents(request, env) {
  try {
    await refreshEventsFromSources(env);
    return new Response(
      JSON.stringify({ success: true, message: 'Events refreshed' }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Refresh failed: ' + error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}

// Generate unified listing HTML with flyer thumbnails
function generateUnifiedListingHTML(events) {
  const upcomingEvents = events
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 20); // Limit to next 20 events
  
  const farewellEvents = upcomingEvents.filter(e => e.venue === 'farewell');
  const howdyEvents = upcomingEvents.filter(e => e.venue === 'howdy');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upcoming Shows - Farewell & Howdy</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            line-height: 1.4;
        }
        .venue-section {
            margin-bottom: 30px;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .venue-title {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #eee;
        }
        .farewell-title { color: #b0ee00; }
        .howdy-title { color: #ff2b13; }
        .event-item {
            display: flex;
            gap: 15px;
            margin: 15px 0;
            padding: 15px;
            border: 1px solid #eee;
            border-radius: 6px;
            background: #fafafa;
        }
        .event-flyer {
            flex-shrink: 0;
            width: 80px;
            height: 80px;
            border-radius: 4px;
            object-fit: cover;
            border: 1px solid #ddd;
        }
        .flyer-placeholder {
            flex-shrink: 0;
            width: 80px;
            height: 80px;
            border-radius: 4px;
            background: #ddd;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        .event-details {
            flex-grow: 1;
        }
        .event-title {
            font-weight: bold;
            font-size: 1.1rem;
            margin-bottom: 5px;
            color: #333;
        }
        .event-datetime {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 5px;
        }
        .event-description {
            color: #777;
            font-size: 0.85rem;
            margin-bottom: 8px;
        }
        .event-meta {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }
        .event-price {
            background: #e8f5e8;
            color: #2d5016;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .ticket-link {
            background: #007bff;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            text-decoration: none;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .ticket-link:hover {
            background: #0056b3;
        }
        .no-events {
            color: #999;
            font-style: italic;
            text-align: center;
            padding: 20px;
        }
        .refresh-note {
            text-align: center;
            color: #666;
            font-size: 0.8rem;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <h1 style="text-align: center; color: #333; margin-bottom: 30px;">Upcoming Shows</h1>
    
    <div class="venue-section">
        <h2 class="venue-title farewell-title">FAREWELL</h2>
        ${farewellEvents.length > 0 ? 
          farewellEvents.map(event => generateEventHTML(event)).join('') :
          '<div class="no-events">No upcoming shows scheduled</div>'
        }
    </div>
    
    <div class="venue-section">
        <h2 class="venue-title howdy-title">HOWDY</h2>
        ${howdyEvents.length > 0 ? 
          howdyEvents.map(event => generateEventHTML(event)).join('') :
          '<div class="no-events">No upcoming shows scheduled</div>'
        }
    </div>
    
    <div class="refresh-note">
        Events automatically updated every 6 hours. Last updated: ${new Date().toLocaleString()}
    </div>
</body>
</html>`;
}

// Generate HTML for a single event
function generateEventHTML(event) {
  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  const timeStr = event.time || '';
  
  const flyerHtml = event.flyerThumbnail ? 
    `<img src="${event.flyerThumbnail}" alt="Event flyer" class="event-flyer">` :
    `<div class="flyer-placeholder">No<br>Image</div>`;
  
  const priceHtml = event.suggestedPrice ? 
    `<span class="event-price">${event.suggestedPrice}</span>` : '';
  
  const ticketHtml = event.ticketLink ? 
    `<a href="${event.ticketLink}" target="_blank" class="ticket-link">Buy Tickets</a>` : '';
  
  return `
    <div class="event-item">
        ${flyerHtml}
        <div class="event-details">
            <div class="event-title">${escapeHtml(event.title)}</div>
            <div class="event-datetime">${dateStr}${timeStr ? ` • ${timeStr}` : ''}</div>
            ${event.description ? `<div class="event-description">${escapeHtml(event.description)}</div>` : ''}
            <div class="event-meta">
                ${priceHtml}
                ${ticketHtml}
            </div>
        </div>
    </div>`;
}

// Utility functions
function generateEventId(eventData) {
  const dateStr = eventData.date.replace(/-/g, '');
  const titleStr = eventData.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
  const venueStr = eventData.venue.slice(0, 3);
  return `${venueStr}_${dateStr}_${titleStr}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function getEventsFromKV(env) {
  try {
    const data = await env.EVENTS_KV.get('events_data');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from KV:', error);
    return [];
  }
}

// Enhanced merge function to handle duplicates effectively
function mergeEventData(existingEvents, newEvents) {
  const merged = [...existingEvents];
  
  for (const newEvent of newEvents) {
    // Look for existing event with same ID or similar title/date/venue
    const existingIndex = merged.findIndex(existing => 
      existing.id === newEvent.id ||
      (
        existing.title.toLowerCase().trim() === newEvent.title.toLowerCase().trim() &&
        existing.date === newEvent.date &&
        existing.venue === newEvent.venue
      )
    );
    
    if (existingIndex >= 0) {
      // Update existing event with new data (merge fields)
      const existing = merged[existingIndex];
      merged[existingIndex] = {
        ...existing,
        ...newEvent,
        // Preserve certain fields from existing if new ones are empty
        description: newEvent.description || existing.description,
        suggestedPrice: newEvent.suggestedPrice || existing.suggestedPrice,
        ticketLink: newEvent.ticketLink || existing.ticketLink,
        flyerUrl: newEvent.flyerUrl || existing.flyerUrl,
        flyerThumbnail: newEvent.flyerThumbnail || existing.flyerThumbnail,
        updated: new Date().toISOString()
      };
    } else {
      // Add new event
      merged.push(newEvent);
    }
  }
  
  // Remove past events (older than 30 days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  
  return merged.filter(event => new Date(event.date) >= cutoffDate);
}

// Scheduled function to refresh events from external sources
async function refreshEventsFromSources(env) {
  try {
    const allEvents = [];
    
    // Fetch from each source with timeout
    await Promise.allSettled(
      SOURCE_URLS.map(async (url) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);
          
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);
          
          if (response.ok) {
            const text = await response.text();
            const parsed = parseEventSource(url, text);
            allEvents.push(...parsed);
          }
        } catch (error) {
          console.error(`Failed to fetch ${url}:`, error);
        }
      })
    );
    
    if (allEvents.length > 0) {
      const existingEvents = await getEventsFromKV(env);
      const mergedEvents = mergeEventData(existingEvents, allEvents);
      await env.EVENTS_KV.put('events_data', JSON.stringify(mergedEvents));
    }
    
    return { success: true, eventsProcessed: allEvents.length };
    
  } catch (error) {
    console.error('Refresh error:', error);
    throw error;
  }
}

// Parse events from different sources
function parseEventSource(url, html) {
  // This would contain the parsing logic for each source
  // Simplified version - in production, implement specific parsers
  const events = [];
  
  if (url.includes('shuttlecockmusic.com')) {
    // Parse Shuttlecock events
    events.push(...parseShuttlecockEvents(html));
  } else if (url.includes('songkick.com')) {
    // Parse Songkick events
    const venue = url.includes('farewell') ? 'farewell' : 'howdy';
    events.push(...parseSongkickEvents(html, venue));
  } else if (url.includes('fygw0.kcmo.xyz')) {
    // Parse gallery worker events
    events.push(...parseGalleryEvents(html));
  }
  
  return events;
}

// Placeholder parsing functions (implement based on actual HTML structure)
function parseShuttlecockEvents(html) {
  // Implement Shuttlecock parsing
  return [];
}

function parseSongkickEvents(html, venue) {
  // Implement Songkick parsing
  return [];
}

function parseGalleryEvents(html) {
  // Implement gallery worker parsing
  return [];
}
