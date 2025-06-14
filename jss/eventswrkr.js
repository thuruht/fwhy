import { DOMParser } from 'linkedom';

// List of external source URLs.
const SOURCE_URLS = [
  'https://www.shuttlecockmusic.com/p/kansas-city-area-show-list.html',
  'https://fygw0.kcmo.xyz/list/howdy',
  'https://fygw0.kcmo.xyz/list/farewell',
  'https://www.songkick.com/venues/4101119-farewell/calendar',
  'https://www.songkick.com/venues/4482636-howdy/calendar'
];

export async function fetch(request, env) {
  return await handleRequest(request, env);
}

export async function scheduled(_event, env) {
  return await handleScheduled(env);
}

// Scheduled handler: fetch, parse, aggregate, and cache events.
async function handleScheduled(env) {
  try {
    const allEvents = [];

    await Promise.all(
      SOURCE_URLS.map(async (url) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10-second timeout

        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);

          if (!response.ok) {
            throw new Error(`Fetch failed for ${url} with status ${response.status}`);
          }

          const text = await response.text();
          let parsed = [];

          if (url.includes('shuttlecockmusic.com')) {
            parsed = parseShuttlecockEvents(text);
          } else if (url.includes('songkick.com/venues/4101119-farewell')) {
            parsed = parseSongkickEvents(text, 'farewell');
          } else if (url.includes('songkick.com/venues/4482636-howdy')) {
            parsed = parseSongkickEvents(text, 'howdy');
          } else if (url.includes('fygw0.kcmo.xyz/list')) {
            parsed = parseFygw0Events(text);
          }

          allEvents.push(...parsed);
        } catch (e) {
          console.error(`Error processing ${url}:`, e);
        }
      })
    );

    // Group events based on venue keywords.
    const howdyEvents = allEvents.filter(ev => ev.venue.toLowerCase().includes('howdy'));
    const farewellEvents = allEvents.filter(ev => ev.venue.toLowerCase().includes('farewell'));

    // Validate KV bindings (we leave these in place)
    if (!env.EVENTS_HOWDY || typeof env.EVENTS_HOWDY.put !== 'function') {
      throw new Error('EVENTS_HOWDY KV binding missing or invalid');
    }
    if (!env.EVENTS_FAREWELL || typeof env.EVENTS_FAREWELL.put !== 'function') {
      throw new Error('EVENTS_FAREWELL KV binding missing or invalid');
    }

    // Write results to KV.
    await env.EVENTS_HOWDY.put('current', JSON.stringify(howdyEvents));
    await env.EVENTS_FAREWELL.put('current', JSON.stringify(farewellEvents));

    console.log('Successfully updated events');
    return new Response('Events updated successfully', { status: 200 });
  } catch (error) {
    console.error('Error updating events:', error);
    return new Response('Error updating events', { status: 500 });
  }
}

// ––––––– PARSING FUNCTIONS –––––––
function parseShuttlecockEvents(html) {
  const events = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const article = doc.querySelector('article.my-wrapz');
  if (!article) return events;

  const paragraphs = article.querySelectorAll('p');
  let currentMonth = '';
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const monthMatch = p.innerHTML.match(/<b>([A-Za-z]+ \d{4})<\/b>/);
    if (monthMatch) {
      currentMonth = monthMatch[1];
      continue;
    }
    if (!p.textContent?.trim() || p.textContent.trim() === '&nbsp;') continue;

    const eventObj = { month: currentMonth, venue: '', date: '', ageRestriction: '' };
    // Assume that the next paragraph has details.
    if (i + 1 < paragraphs.length) {
      const detailsLine = paragraphs[i + 1].textContent?.trim() || '';
      if (detailsLine.includes('@')) {
        eventObj.date = detailsLine.split('@')[0].trim() || 'Unknown Date';
        eventObj.venue = detailsLine.split('@')[1]?.split('-')[0].trim() || 'Unknown Venue';
        eventObj.ageRestriction = detailsLine.toLowerCase().includes('all ages')
          ? 'All Ages'
          : detailsLine.toLowerCase().includes('21+')
            ? '21+'
            : '';
        i++; // Skip details line.
      }
    }
    if (!eventObj.venue || !eventObj.date) {
      console.warn(`Incomplete event data: ${JSON.stringify(eventObj)}`);
    } else {
      events.push(eventObj);
    }
  }
  return events;
}

function parseSongkickEvents(html, state) {
  const events = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  // Adjust this selector if Songkick changes structure.
  const eventCards = doc.querySelectorAll('.event-card');
  eventCards.forEach(card => {
    const title = card.querySelector('.event-title')?.textContent.trim() || 'No title';
    const date = card.querySelector('.event-date')?.textContent.trim() || new Date().toISOString();
    events.push({
      title,
      date,
      venue: state,
      month: extractMonth(date),
      ageRestriction: ''
    });
  });
  return events;
}

function parseFygw0Events(html) {
  const events = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  // Adjust the selector below if needed.
  const items = doc.querySelectorAll('.event-item');
  items.forEach(item => {
    const title = item.querySelector('.title')?.textContent.trim() || 'No title';
    const date = item.querySelector('.date')?.textContent.trim() || new Date().toISOString();
    const venue = item.querySelector('.venue')?.textContent.trim() || 'Unknown Venue';
    events.push({
      title,
      date,
      venue,
      month: extractMonth(date),
      ageRestriction: ''
    });
  });
  return events;
}

// Helper: Extract month and year from a date string.
function extractMonth(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  } catch (e) {
    console.warn(`Invalid date string encountered: "${dateStr}"`);
    return '';
  }
}

// ––––––– ICS GENERATION FUNCTION –––––––
function generateICS(events, calendarTitle) {
  let ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//" + calendarTitle + "//EN\r\n";
  const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + "Z";
  events.forEach((event, index) => {
    let dt = new Date(event.date);
    if (isNaN(dt)) {
      console.warn(`Invalid date for event: ${JSON.stringify(event)}`);
      dt = new Date();
    }
    const dtStart = formatDate(dt);
    const dtEnd = formatDate(new Date(dt.getTime() + 2 * 60 * 60 * 1000)); // 2-hour duration
    ics += "BEGIN:VEVENT\r\n";
    ics += `UID:event-${index}@${calendarTitle}\r\n`;
    ics += `DTSTAMP:${formatDate(new Date())}\r\n`;
    ics += `DTSTART:${dtStart}\r\n`;
    ics += `DTEND:${dtEnd}\r\n`;
    ics += `SUMMARY:${calendarTitle} Event - ${event.venue}\r\n`;
    ics += "END:VEVENT\r\n";
  });
  ics += "END:VCALENDAR\r\n";
  return ics;
}

// ––––––– REQUEST HANDLER –––––––
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  let state, kvBinding;

  // Determine state and KV namespace.
  if (pathname.startsWith('/fwevent')) {
    state = 'farewell';
    kvBinding = env.EVENTS_FAREWELL;
  } else if (pathname.startsWith('/hyevent')) {
    state = 'howdy';
    kvBinding = env.EVENTS_HOWDY;
  } else {
    return new Response('Not found', { status: 404 });
  }

  // If URL ends with "calendar.ics", return the ICS file.
  if (pathname.endsWith('calendar.ics')) {
    const eventsJson = await kvBinding.get('current');
    if (!eventsJson) {
      return new Response(`<html><body><h1>No events found for ${state}</h1></body></html>`, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    let events;
    try {
      events = JSON.parse(eventsJson);
    } catch (e) {
      console.error(`Error parsing events JSON for ${state}:`, e);
      return new Response(`<html><body><h1>Invalid events data for ${state}</h1></body></html>`, {
        headers: { 'Content-Type': 'text/html' },
        status: 500
      });
    }
    const calendarTitle = state.charAt(0).toUpperCase() + state.slice(1);
    const icsContent = generateICS(events, calendarTitle);
    return new Response(icsContent, {
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': `attachment; filename="${state}-events.ics"`
      }
    });
  } else {
    // Otherwise, return a simple HTML event listing.
    const eventsJson = await kvBinding.get('current');
    if (!eventsJson) {
      return new Response(`<html><body><h1>No events found for ${state}</h1></body></html>`, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    let events;
    try {
      events = JSON.parse(eventsJson);
    } catch (e) {
      console.error(`Error parsing events JSON for ${state}:`, e);
      return new Response(`<html><body><h1>Invalid events data for ${state}</h1></body></html>`, {
        headers: { 'Content-Type': 'text/html' },
        status: 500
      });
    }
    let html = `<html><head><title>${state.charAt(0).toUpperCase() + state.slice(1)} Events</title></head><body>`;
    html += `<h1>${state.charAt(0).toUpperCase() + state.slice(1)} Events</h1><ul>`;
    events.forEach(event => {
      html += `<li>${event.date} - ${event.venue} (${event.month})` +
              (event.ageRestriction ? ` - ${event.ageRestriction}` : '') +
              `</li>`;
    });
    html += `</ul></body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  }
}
