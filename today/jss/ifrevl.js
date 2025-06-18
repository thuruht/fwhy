// ifrevl.js - Using Event Delegation for Popups

// Iframe resizing functions (keep as is)
function resizeIframe(obj) {
  obj.style.height = obj.contentWindow.document.documentElement.scrollHeight + 'px';
}
function setupContentResize(iframe) {
  iframe.contentWindow.addEventListener('resize', () => resizeIframe(iframe));
  const observer = new MutationObserver(() => resizeIframe(iframe));
  observer.observe(iframe.contentWindow.document, { childList: true, subtree: true });
}
function onIframeLoad(iframe) {
  resizeIframe(iframe);
  setupContentResize(iframe);
}

// URL generation for calendar links (keep corrected version)
function generateUrls(state) {
  const baseUrl = window.location.hostname;
  const eventPathBase = state === 'howdy' ? 'hyevent' : 'fwevent'; // Path WITHOUT trailing slash
  return {
    showListings: `https://${baseUrl}/${eventPathBase}/`, // Add slash for listings
    icsFile: `https://${baseUrl}/${eventPathBase}/calendar.ics`, // Use base path for file
    googleCalendar: `https://www.google.com/calendar/render?cid=${encodeURIComponent(`https://${baseUrl}/${eventPathBase}/calendar.ics`)}` // Encode correct URL
  };
}

// Update calendar links function (keep combined version)
function updateCalendarLinks() {
  const state = document.body.dataset.state || 'farewell';
  const urls = generateUrls(state);

  // --- Part 1: Update the main #credEt block ---
  const credEtDiv = document.getElementById('credEt');
  if (credEtDiv) {
    // Note: Added class="open-popup" to the 'shows' link here too
    const mainBlockHtml = `
<div>
<hr> || <a href="${urls.showListings}" class="open-popup">shows</a> || <a href="${urls.icsFile}">.ics</a> || <a href="${urls.googleCalendar}" target="_blank">gcal</a> || <hr><small>(above links per venue ; toggle farewell/howdy to change!)</small><hr>
<p><small>calendar graphic (and the other swell graphics and general layout of this site) designed by the excellent <a href="https://austinchapmandesign.com/" target="_blank" rel="noopener">austin chapman</a> - however, any parts of the site that you dislike, that are animated annoyingly, bitcrushed, badly implemented, or the like, may instead be blamed on me (<a href="https://ntapkc.com" target="_blank" rel="noopener">jojo</a>), with the exception of show/event flyers, which are variously sourced</small></p>
</div>
    `;
    credEtDiv.innerHTML = mainBlockHtml;
    console.log('[UpdateLinks] Updated #credEt block.');
  } else {
    console.warn('[UpdateLinks] Element with id="credEt" not found.');
  }

  // --- Part 2: Update individual links by class ---
  const listingLinks = document.querySelectorAll('.cal-link-listing');
  listingLinks.forEach(link => { if (link instanceof HTMLAnchorElement) link.href = urls.showListings; });
  if (listingLinks.length > 0) console.log(`[UpdateLinks] Updated ${listingLinks.length} '.cal-link-listing'.`);

  const icsLinks = document.querySelectorAll('.cal-link-ics');
  icsLinks.forEach(link => { if (link instanceof HTMLAnchorElement) link.href = urls.icsFile; });
  if (icsLinks.length > 0) console.log(`[UpdateLinks] Updated ${icsLinks.length} '.cal-link-ics'.`);

  const gcalLinks = document.querySelectorAll('.cal-link-gcal');
  gcalLinks.forEach(link => { if (link instanceof HTMLAnchorElement) link.href = urls.googleCalendar; });
  if (gcalLinks.length > 0) console.log(`[UpdateLinks] Updated ${gcalLinks.length} '.cal-link-gcal'.`);

  console.log(`[UpdateLinks] Link updates complete for state: ${state}`);
}

// --- REMOVED setupPopupLinks function ---

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  // Set up calendar links (runs once initially)
  updateCalendarLinks();

  // Watch for state changes and update links
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'data-state') {
        updateCalendarLinks();
        // NO need to re-run popup setup here anymore
      }
    });
  });
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-state']
  });

  // --- ADDED Event Delegation for Popups ---
  document.body.addEventListener('click', function(event) {
    // Check if the clicked element itself OR its parent is a link with '.open-popup'
    const link = event.target.closest('a.open-popup');

    if (link && link instanceof HTMLAnchorElement) {
        event.preventDefault(); // Prevent default link navigation

        const url = link.getAttribute('href');
        if (!url) return; // No URL, do nothing

        const popupWidth = 800; // Adjusted size
        const popupHeight = 600;
        const left = (window.innerWidth - popupWidth) / 2;
        const top = (window.innerHeight - popupHeight) / 2;

        const popup = window.open(
          url,
          '_blank',
          `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        // Fallback if popup blocker prevents window.open
        if (!popup) {
           console.warn("Popup blocked? Attempting navigation in new tab.");
           window.open(url, '_blank');
        }
    }
  }); // End event delegation listener

  // Set up iframe auto-resizing (keep as is)
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    iframe.addEventListener('load', function() {
      onIframeLoad(iframe);
    });
    // Also trigger resize if iframe already loaded (e.g., cached)
    if (iframe.contentWindow && iframe.contentWindow.document.readyState === 'complete') {
        onIframeLoad(iframe);
    }
  });
}); // End DOMContentLoaded

// Window resize handler for iframes (keep as is)
window.addEventListener('resize', function() {
  document.querySelectorAll('iframe').forEach(iframe => {
    if (iframe.contentWindow) {
      resizeIframe(iframe);
    }
  });
});

// --- REMOVED stray setupPopupLinks() call ---

