document.addEventListener('DOMContentLoaded', () => {
  // --------------------------
  // DOM Elements
  // --------------------------
  const howdySpan = document.querySelector('.header-title .sulk'); 
  const farewellSpan = document.querySelector('.header-title .span2'); 
  const body = document.querySelector('body');
  const title = document.querySelector('title');
  const address = document.getElementById('address');

  const mailingListForm = document.getElementById('mailing-list-form');
  const nameField = mailingListForm?.querySelector('[name="name"]');
  const messageField = mailingListForm?.querySelector('[name="message"]');

  const uploadButton = document.querySelector('.admin-upload-link button');
  const archiveButton = document.querySelector('.view-archives-button'); // If i add back the "View Archives" button

  // It's a single slideshow container:
  const slideImage   = document.getElementById('slide-image');
  const slideCaption = document.getElementById('slide-caption');
  const prevButton   = document.getElementById('prev-button');
  const nextButton   = document.getElementById('next-button');

  // Sorting UI (drop-down)
  const sortSelect = document.getElementById('sort-select');

  // Constants / Config
  // Determine the correct API base URL based on current domain
  const getCurrentDomain = () => window.location.hostname;
  const getApiBaseUrl = () => {
    const domain = getCurrentDomain();
    // Use the new unified admin backend for API calls
    if (domain === 'dev.farewellcafe.com') {
      return 'https://fwhyadmin-dev.your-subdomain.workers.dev';
    } else if (domain === 'farewellcafe.com') {
      return 'https://admin.farewellcafe.com';
    }
    // For local development, use the admin backend dev server
    return 'https://fwhyadmin-dev.your-subdomain.workers.dev';
  };
  
  const BASE_URL = getApiBaseUrl();
  const CACHE_EXPIRY_MS = 15 * 60 * 1000;    // 15 minutes
  const cache = new Map(); // Simple in-memory cache

  // --------------------------
  // Slideshow-Related Variables
  // --------------------------
  let allFlyers = [];         // Full dataset (either upcoming or past) from the Worker
  let displayedFlyers = [];    // Currently displayed flyers (post-sort/filter)
  let currentSlideIndex = 0;
  let autoplayInterval;
  const SLIDE_INTERVAL = 5000; // Interval for autoplay (5 seconds)

  // --------------------------
  // Helper Functions
  // --------------------------

  /**
   * Toggles images based on the current state.
   * e.g., sets "farewell" images vs. "howdy" images
   */
  function toggleImages(state) {
    const imageMappings = {
      farewell: {
        conic: './img/fm.png',
        conica: './img/fm2.png',
        nicic: './img/fwm.png',
        nicica: './img/fm2.png',
        calendar: './img/fwcal.png',
      },
      howdy: {
        conic: './img/hym.png',
        conica: './img/hm.png',
        nicic: './img/hm2.png',
        nicica: './img/hm.png',
        calendar: './img/hycal.png',
      },
    };

    const target = imageMappings[state];
    if (!target) {
      console.error(`No image mappings for state: ${state}`);
      return;
    }

    // Replace images
    document.querySelectorAll('.conic').forEach(img => img.src = target.conic);
    document.querySelectorAll('.conica').forEach(img => img.src = target.conica);
    document.querySelectorAll('.nicic').forEach(img => img.src = target.nicic);
    document.querySelectorAll('.nicica').forEach(img => img.src = target.nicica);

    const calendarContainer = document.getElementById('calendar');
    if (calendarContainer) {
      calendarContainer.querySelectorAll('img').forEach(img => {
        img.src = target.calendar;
      });
    }
  }

  /**
   * Updates social media links based on the current state.
   */
  function updateSocialLinks(state) {
    const socialLinks = {
      howdy: {
        facebook: 'https://www.facebook.com/howdykcmo',
        instagram: 'https://instagram.com/howdykcmo',
        twitter: 'https://x.com/HowdyKCMO',
        spotify: 'https://open.spotify.com/playlist/44StXfAJQiPoDQYegr4kec?si=8f07faf57647401f',
        secret: 'https://linktr.ee/farewellhowdy',
      },
      farewell: {
        facebook: 'https://www.facebook.com/farewelltransmission',
        instagram: 'https://instagram.com/farewellkcmo',
        twitter: 'https://x.com/farewellcafe',
        spotify: 'https://open.spotify.com/playlist/1eXsLdNQe319cAbnsmpi06?si=333d96c262f5424d',
        secret: 'https://linktr.ee/farewellhowdy',
      },
    };

    const links = socialLinks[state];
    if (!links) {
      console.error(`No social links for state: ${state}`);
      return;
    }

    // Update each social link
    const socialAnchors = document.querySelectorAll('.social-icons a');
    const platforms = ['facebook', 'instagram', 'twitter', 'spotify', 'secret'];

    socialAnchors.forEach((anchor, index) => {
      const platform = platforms[index];
      if (links[platform]) {
        anchor.href = links[platform];
      }
    });
  }

  /**
   * Fetch upcoming or past flyers from the unified events Worker.
   * @param {string} state - 'howdy' or 'farewell'
   * @param {boolean} showPast - whether to fetch archives or upcoming
   */
  async function fetchFlyers(state, showPast = false) {
    try {
      // Use a simple cache key
      const cacheKey = `${state}-${showPast ? 'past' : 'upcoming'}`;
      const now = Date.now();

      // Check cache
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (now - cached.timestamp < CACHE_EXPIRY_MS) {
          // Return cached data
          return cached.data;
        } else {
          // Expired
          cache.delete(cacheKey);
        }
      }

      // Use new unified events API endpoint with venue filtering
      let url, response, data;
      
      if (showPast) {
        // For archives, use the unified events endpoint with date filtering
        url = `${BASE_URL}/api/events/list?venue=${state}&past=true&thumbnails=true`;
        try {
          response = await fetch(url);
          if (!response.ok) {
            // Fallback to legacy archives endpoint
            url = `${BASE_URL}/archives?type=${state}`;
            response = await fetch(url);
          }
          data = await response.json();
        } catch (error) {
          console.warn('Unified API not available, trying legacy endpoint:', error);
          // Fallback to legacy
          url = `${BASE_URL}/archives?type=${state}`;
          response = await fetch(url);
          data = await response.json();
        }
      } else {
        // For upcoming events, use the new unified events endpoint
        url = `${BASE_URL}/api/events/list?venue=${state}&thumbnails=true&limit=20`;
        try {
          response = await fetch(url);
          if (!response.ok) {
            // Fallback to legacy list endpoint
            url = `${BASE_URL}/list/${state}`;
            response = await fetch(url);
          }
          data = await response.json();
        } catch (error) {
          console.warn('Unified API not available, trying legacy endpoint:', error);
          // Fallback to legacy
          url = `${BASE_URL}/list/${state}`;
          response = await fetch(url);
          data = await response.json();
        }
      }
      
      // Transform data to match expected flyer format
      // New unified API returns {events: [...], total: number, venue: string}
      // Legacy endpoint returns array directly
      let events;
      if (data.events) {
        // New unified API format
        events = data.events;
      } else if (Array.isArray(data)) {
        // Legacy API format
        events = data;
      } else {
        events = [];
      }

      const transformedData = events.map(event => ({
        id: event.id,
        title: event.title,
        // New API provides thumbnail_url, fallback to legacy fields
        imageUrl: event.thumbnail_url || event.flyerThumbnail || event.flyer_url || event.flyerUrl || event.imageUrl,
        date: event.date || event.eventDate,
        time: event.default_time || event.time || event.eventTime,
        venue: event.venue_display || event.venue || event.type || state,
        description: event.description,
        suggestedPrice: event.suggested_price || event.suggestedPrice,
        ticketLink: event.ticket_url || event.ticketLink,
        ageRestriction: event.age_restriction,
        // New fields from unified API
        dateFormatted: event.date_formatted,
        thumbnailUrl: event.thumbnail_url
      }));

      // Store in cache
      cache.set(cacheKey, { data: transformedData, timestamp: now });
      return transformedData;
    } catch (error) {
      console.error('Error fetching flyers:', error);
      return [];
    }
  }

  /**
   * Displays the current slide (image + caption) based on `currentSlideIndex`.
   */
  function displaySlide(index) {
    if (!displayedFlyers.length) {
      if (slideImage) {
        slideImage.src = '';
      }
      if (slideCaption) {
        slideCaption.textContent = 'No events found.';
      }
      return;
    }

    // Wrap index for a continuous loop, or clamp if you don't want looping.
    if (index < 0) {
      currentSlideIndex = displayedFlyers.length - 1;
    } else if (index >= displayedFlyers.length) {
      currentSlideIndex = 0;
    }

    const flyer = displayedFlyers[currentSlideIndex];
    if (!flyer) return;

    if (slideImage) {
      slideImage.src = flyer.imageUrl || '';
      slideImage.alt = flyer.title || 'Flyer';
    }
  }

  /**
   * Initializes (or re-initializes) the slideshow for the current state & sort selection.
   * Uses the new slideshow API endpoint for better ordering control.
   */
  async function initSlideshow() {
    const currentState = body?.dataset.state; // 'farewell' or 'howdy'
    const sortValue = sortSelect ? sortSelect.value : 'soonest'; // default to soonest if undefined

    const showPast = (sortValue === 'past'); // Decide if we fetch archives or upcoming
    
    if (!showPast) {
      // For upcoming events, try the new slideshow endpoint first for better ordering
      try {
        const slideshowUrl = `${BASE_URL}/api/events/slideshow?venue=${currentState}`;
        const response = await fetch(slideshowUrl);
        if (response.ok) {
          const data = await response.json();
          console.log('Using slideshow API endpoint:', data);
          // Convert slideshow format to flyer format
          allFlyers = (data.slideshow || []).map(slide => ({
            id: slide.id,
            title: slide.title,
            imageUrl: slide.thumbnail_url || slide.image_url,
            date: slide.date,
            venue: slide.venue,
            // Add slideshow order for potential custom sorting
            order: slide.order || 0
          }));
        } else {
          throw new Error('Slideshow endpoint not available');
        }
      } catch (error) {
        console.log('Slideshow API not available, falling back to events list:', error);
        // Fallback to regular events list
        allFlyers = await fetchFlyers(currentState, showPast);
      }
    } else {
      // For past events, use the regular fetchFlyers function
      allFlyers = await fetchFlyers(currentState, showPast);
    }

    // You could do further sorting here if needed.
    displayedFlyers = allFlyers;
    currentSlideIndex = 0;
    displaySlide(currentSlideIndex);

    // Start autoplay
    startAutoplay();
  }

  /**
   * Toggles the body state between 'howdy' and 'farewell', then re-fetches slideshow data.
   */
  function toggleState() {
    if (!body) return;
    const currentState = body.dataset.state;
    const newState = currentState === 'farewell' ? 'howdy' : 'farewell';
    body.dataset.state = newState;
    body.classList.toggle('howdy-active'); // for theming

    // Update dynamic text
    if (farewellSpan) {
      farewellSpan.textContent = (newState === 'howdy') ? 'HOWDY' : 'FAREWELL';
    }
    if (howdySpan) {
      howdySpan.textContent = (newState === 'howdy') ? '& FAREWELL' : '& HOWDY';
    }
    if (address) {
      address.textContent = (newState === 'howdy')
        ? '6523 STADIUM DRIVE, KANSAS CITY, MISSOURI'
        : '6515 STADIUM DRIVE, KANSAS CITY, MISSOURI';
    }

    if (title) {
      title.textContent = (newState === 'farewell')
        ? 'FAREWELL | HOWDY | KCMO - Howdy and Farewell - Kansas City'
        : 'HOWDY | FAREWELL | KCMO - Farewell and Howdy - Kansas City';
    }

    toggleImages(newState);
    updateSocialLinks(newState);

    // Re-init slideshow for the new state
    initSlideshow();
  }

  /**
   * Start autoplay interval.
   */
  function startAutoplay() {
    // Clear existing interval before starting a new one
    stopAutoplay();
    autoplayInterval = setInterval(() => {
      currentSlideIndex++;
      displaySlide(currentSlideIndex);
    }, SLIDE_INTERVAL);
  }

  /**
   * Stop any existing autoplay interval.
   */
  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  }

  // Slideshow Prev/Next + Autoplay Control
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      currentSlideIndex--;
      displaySlide(currentSlideIndex);
      stopAutoplay();
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      currentSlideIndex++;
      displaySlide(currentSlideIndex);
      stopAutoplay();
    });
  }

  // Pause/resume autoplay on hover
  if (slideImage) {
    slideImage.addEventListener('mouseenter', stopAutoplay);
    slideImage.addEventListener('mouseleave', startAutoplay);
  }

  // --------------------------
  // Upload & Archives (Modals)
  // --------------------------

  /**
   * Creates and displays a basic modal.
   */
  function createModal(titleText, contentHTML) {
    const existingModal = document.querySelector('.modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <h2>${titleText}</h2>
        ${contentHTML}
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.close-button');
    closeBtn?.addEventListener('click', () => modal.remove());

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * If need separate Archives modal, can keep this.
   */
  function openArchiveModal(state) {
    const archiveContentHTML = `<div id="archiveContent">Loading...</div>`;
    createModal('Archived Events', archiveContentHTML);
    fetchAndDisplayArchives(state);
  }

  /**
   * Fetch and display archives in the modal.
   */
  async function fetchAndDisplayArchives(state) {
    const archiveContent = document.getElementById('archiveContent');
    if (!archiveContent) return;

    try {
      const response = await fetch(`${BASE_URL}/archives?type=${state}`);
      if (!response.ok) throw new Error(`Failed to fetch archives: ${response.statusText}`);
      const flyers = await response.json();

      archiveContent.innerHTML = ''; // Clear "Loading..."

      if (!flyers.length) {
        archiveContent.innerHTML = '<p>No past events found.</p>';
        return;
      }

      flyers.forEach((flyer) => {
        const flyerItem = document.createElement('div');
        flyerItem.className = 'flyer-item';
        flyerItem.innerHTML = `
          <h3>${flyer.title}</h3>
          <p>${flyer.description}</p>
          <p><strong>Date:</strong> ${flyer.date}</p>
          <p><strong>Time:</strong> ${flyer.time}</p>
        `;
        archiveContent.appendChild(flyerItem);
      });
    } catch (error) {
      console.error('Error fetching archives:', error);
      archiveContent.innerHTML = `<p>Error fetching archives: ${error.message}</p>`;
    }
  }

  // --------------------------
  // Mailing List + Hidden Fields
  // --------------------------

  /**
   * Updates hidden fields in the mailing list form based on the current state.
   */
  function updateHiddenFields() {
    const newState = document.body?.dataset.state;
    if (nameField) {
      nameField.value = "Add to mailing list"; // Example default
    }

    if (messageField) {
      if (newState === 'howdy') {
        messageField.value = 'HOWDY';
      } else if (newState === 'farewell') {
        messageField.value = 'FAREWELL';
      } else {
        messageField.value = 'UNKNOWN'; 
      }
    }
  }

  // --------------------------
  // Event Listeners
  // --------------------------

  // Toggle state when user clicks the "sulk" span (HOWDY / FAREWELL)
  if (howdySpan) {
    howdySpan.addEventListener('click', toggleState);
  }

  // Archives button
  if (archiveButton) {
    archiveButton.addEventListener('click', () => {
      if (!body) return;
      openArchiveModal(body.dataset.state);
    });
  }

  // Mailing list form submission
  if (mailingListForm) {
    mailingListForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      if (!data.name || !data.message) {
        console.error('Hidden field(s) missing or empty.');
        return;
      }

      try {
        // Send the POST request
        await fetch('https://fwhy.kcmo.xyz/mailing-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        // Subscribe to Kit newsletter
        const email = encodeURIComponent(data.email);
        try {
          await fetch('https://app.kit.com/forms/8151329/subscriptions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email_address: data.email
            })
          });
          console.log('Successfully subscribed to newsletter');
        } catch (error) {
          console.error('Newsletter subscription failed:', error);
        }

        // Reset the form
        e.target.reset();
        updateHiddenFields();
      } catch (error) {
        console.error('Error:', error);
      }
    });
  }

  // Sorting drop-down: re-init the slideshow with chosen sort
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      initSlideshow(); 
    });
  }

  // --------------------------
  // Events Listing Popup Functions
  // --------------------------

  /**
   * Generate and display events listing popup content with thumbnails
   * @param {string} venue - 'howdy' or 'farewell'
   */
  async function displayEventsPopup(venue) {
    console.log('displayEventsPopup called with venue:', venue);
    console.log('BASE_URL:', BASE_URL);
    try {
      // Use new unified API endpoint with thumbnails
      const endpoint = `${BASE_URL}/api/events/list?venue=${venue}&thumbnails=true&limit=50`;
      console.log('Calling unified API endpoint:', endpoint);
      
      let upcomingEvents = [];
      
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          console.log('Unified API success:', data);
          upcomingEvents = data.events || [];
        } else {
          throw new Error(`Unified API failed: ${response.status}`);
        }
      } catch (error) {
        console.warn('Unified API not available, falling back to legacy:', error);
        // Fallback to legacy endpoint
        const legacyEndpoint = `${BASE_URL}/list/${venue}`;
        console.log('Calling legacy endpoint:', legacyEndpoint);
        const legacyResponse = await fetch(legacyEndpoint);
        if (!legacyResponse.ok) {
          throw new Error(`Legacy endpoint failed: ${legacyResponse.status} ${legacyResponse.statusText}`);
        }
        const legacyData = await legacyResponse.json();
        upcomingEvents = Array.isArray(legacyData) ? legacyData : [];
      }
      
      console.log('Final events array:', upcomingEvents.length, 'events');

      // Create popup content with enhanced styling and thumbnails
      let popupContent = `
        <div style="padding: 20px; font-family: var(--font-hnm11); background: var(--card-bg-color); min-height: 100vh;">
          <h2 style="text-align: center; margin-bottom: 30px; color: var(--text-color); border-bottom: 2px solid var(--nav-border-color); padding-bottom: 10px;">
            ${venue.toUpperCase()} UPCOMING SHOWS
          </h2>
      `;

      if (upcomingEvents.length === 0) {
        popupContent += `
          <p style="text-align: center; color: var(--text-color); font-style: italic;">
            No upcoming shows found.
          </p>
        `;
      } else {
        upcomingEvents.forEach(event => {
          // Use date_formatted from unified API if available, fallback to formatting
          const formattedDate = event.date_formatted || (() => {
            const eventDate = new Date(event.date || event.eventDate);
            return eventDate.toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          })();

          // Get thumbnail from unified API or fallback to legacy fields
          const thumbnailUrl = event.thumbnail_url || event.flyerThumbnail || event.flyer_url || event.imageUrl;
          const venueDisplay = event.venue_display || (event.venue || event.type || venue).toUpperCase();
          const eventTime = event.default_time || event.time || event.eventTime;
          const suggestedPrice = event.suggested_price || event.suggestedPrice;
          const ticketUrl = event.ticket_url || event.ticketLink;

          popupContent += `
            <div style="border: 1px solid var(--nav-border-color); margin: 15px 0; padding: 20px; 
                        background: rgba(255,255,255,0.95); border-radius: 8px; 
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.2s ease;">
              <div style="display: flex; gap: 20px; align-items: flex-start;">
                ${thumbnailUrl ? `
                  <img src="${thumbnailUrl}" alt="${event.title}" 
                       style="width: 100px; height: 100px; object-fit: cover; border-radius: 6px; 
                              flex-shrink: 0; border: 2px solid var(--nav-border-color);">
                ` : `
                  <div style="width: 100px; height: 100px; background: var(--nav-border-color); 
                              border-radius: 6px; display: flex; align-items: center; justify-content: center; 
                              color: white; font-size: 12px; text-align: center; flex-shrink: 0;">
                    No Image
                  </div>
                `}
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 12px 0; color: var(--text-color); font-size: 1.2em; 
                             line-height: 1.3; font-weight: bold;">
                    ${event.title}
                  </h3>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                              gap: 8px; margin-bottom: 12px;">
                    <p style="margin: 0; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 1.1em;">📅</span>
                      <strong>${formattedDate}</strong>
                    </p>
                    ${eventTime ? `
                      <p style="margin: 0; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.1em;">🕐</span>
                        ${eventTime}
                      </p>
                    ` : ''}
                    <p style="margin: 0; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 1.1em;">📍</span>
                      <strong>${venueDisplay}</strong>
                    </p>
                    ${event.age_restriction ? `
                      <p style="margin: 0; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.1em;">🔞</span>
                        ${event.age_restriction}
                      </p>
                    ` : ''}
                    ${suggestedPrice ? `
                      <p style="margin: 0; color: var(--text-color); display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.1em;">💰</span>
                        <strong>${suggestedPrice}</strong>
                      </p>
                    ` : ''}
                  </div>
                  ${event.description ? `
                    <p style="margin: 12px 0; color: var(--text-color); font-size: 0.95em; 
                              line-height: 1.5; padding: 10px; background: rgba(0,0,0,0.05); 
                              border-radius: 4px; border-left: 3px solid var(--nav-border-color);">
                      ${event.description.substring(0, 300)}${event.description.length > 300 ? '...' : ''}
                    </p>
                  ` : ''}
                  ${ticketUrl ? `
                    <a href="${ticketUrl}" target="_blank" rel="noopener" 
                       style="display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; 
                              padding: 10px 16px; background: var(--button-bg-color); 
                              color: var(--button-text-color); text-decoration: none; 
                              border-radius: 6px; font-size: 0.95em; font-weight: bold; 
                              transition: all 0.2s ease; border: 2px solid transparent;">
                      <span style="font-size: 1.1em;">🎫</span>
                      Get Tickets
                    </a>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        });
      }

      popupContent += `
          <div style="text-align: center; margin-top: 20px;">
            <small style="color: var(--text-color); opacity: 0.7;">
              Switch between HOWDY and FAREWELL modes to see different venue listings
            </small>
          </div>
        </div>
      `;

      console.log('Popup content generated successfully');
      return popupContent;
    } catch (error) {
      console.error('Error fetching events for popup:', error);
      
      // Special handling for CORS errors
      if (error.message.includes('NetworkError') || error.message.includes('CORS')) {
        return `
          <div style="padding: 20px; text-align: center;">
            <h2 style="color: var(--text-color); margin-bottom: 20px;">
              ${venue.toUpperCase()} SHOWS
            </h2>
            <p style="color: #ea4110; margin-bottom: 15px;">
              Unable to load events due to CORS restrictions.
            </p>
            <p style="color: #666; font-size: 0.9em; margin-bottom: 15px;">
              This is a temporary issue with cross-origin requests from dev.farewellcafe.com to the API server.
            </p>
            <p style="color: #666; font-size: 0.9em;">
              <strong>To view events:</strong><br>
              • Visit <a href="https://fwhy.kcmo.xyz" target="_blank" style="color: #007bff;">fwhy.kcmo.xyz</a> directly<br>
              • Or contact the admin to update CORS settings for dev.farewellcafe.com
            </p>
          </div>
        `;
      }
      
      return `
        <div style="padding: 20px; text-align: center;">
          <p style="color: #ea4110;">Error loading events: ${error.message}</p>
          <p style="color: #666; font-size: 0.9em;">Please try again later or check console for details.</p>
        </div>
      `;
    }
  }

      // Create popup content
      let popupContent = `
        <div style="padding: 20px; font-family: var(--font-hnm11); background: var(--card-bg-color);">
          <h2 style="text-align: center; margin-bottom: 20px; color: var(--text-color);">
            ${venue.toUpperCase()} UPCOMING SHOWS
          </h2>
      `;

      if (upcomingEvents.length === 0) {
        popupContent += `
          <p style="text-align: center; color: var(--text-color); font-style: italic;">
            No upcoming shows found.
          </p>
        `;
      } else {
        upcomingEvents.forEach(event => {
          const eventDate = new Date(event.date || event.eventDate);
          const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

          popupContent += `
            <div style="border: 1px solid var(--nav-border-color); margin: 10px 0; padding: 15px; background: rgba(255,255,255,0.9);">
              <div style="display: flex; gap: 15px; align-items: flex-start;">
                ${(event.flyerThumbnail || event.imageUrl) ? `
                  <img src="${event.flyerThumbnail || event.imageUrl}" alt="${event.title}" 
                       style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">
                ` : ''}
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 8px 0; color: var(--text-color); font-size: 1.1em;">
                    ${event.title}
                  </h3>
                  <p style="margin: 4px 0; color: var(--text-color); font-weight: bold;">
                    📅 ${formattedDate}
                    ${event.time || event.eventTime ? ` at ${event.time || event.eventTime}` : ''}
                  </p>
                  <p style="margin: 4px 0; color: var(--text-color);">
                    📍 ${(event.venue || venue).toUpperCase()}
                  </p>
                  ${event.suggestedPrice ? `
                    <p style="margin: 4px 0; color: var(--text-color);">
                      💰 ${event.suggestedPrice}
                    </p>
                  ` : ''}
                  ${event.description ? `
                    <p style="margin: 8px 0 4px 0; color: var(--text-color); font-size: 0.9em; line-height: 1.4;">
                      ${event.description.substring(0, 200)}${event.description.length > 200 ? '...' : ''}
                    </p>
                  ` : ''}
                  ${event.ticketLink ? `
                    <a href="${event.ticketLink}" target="_blank" rel="noopener" 
                       style="display: inline-block; margin-top: 8px; padding: 6px 12px; 
                              background: var(--button-bg-color); color: var(--button-text-color); 
                              text-decoration: none; border-radius: 4px; font-size: 0.9em;">
                      🎫 Get Tickets
                    </a>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        });
      }

      popupContent += `
          <div style="text-align: center; margin-top: 20px;">
            <small style="color: var(--text-color); opacity: 0.7;">
              Switch between HOWDY and FAREWELL modes to see different venue listings
            </small>
          </div>
        </div>
      `;

      console.log('Popup content generated successfully');
      return popupContent;
    } catch (error) {
      console.error('Error fetching events for popup:', error);
      return `
        <div style="padding: 20px; text-align: center;">
          <p style="color: #ea4110;">Error loading events: ${error.message}</p>
          <p style="color: #666; font-size: 0.9em;">Please try again later or check console for details.</p>
        </div>
      `;
    }
  }

  // --------------------------
  // Popup System Integration
  // --------------------------

  // Listen for popup requests on show listings links
  document.addEventListener('click', async function(event) {
    const link = event.target.closest('a.cal-link-listing');
    
    if (link && (link.classList.contains('open-popup') || link.getAttribute('href') === '#shows')) {
      event.preventDefault();
      console.log('Show listings popup triggered');
      
      // Determine venue from current state
      const currentState = body?.dataset.state || 'farewell';
      console.log('Current venue state:', currentState);
      
      // Generate popup content
      console.log('Fetching events for popup...');
      const popupContent = await displayEventsPopup(currentState);
      
      // Create and show popup window
      const popupWindow = window.open('', 'eventsPopup', 
        'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (popupWindow) {
        popupWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${currentState.toUpperCase()} Shows - Farewell & Howdy</title>
            <link rel="stylesheet" href="${window.location.origin}/css/ccssss.css">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0;">
            ${popupContent}
          </body>
          </html>
        `);
        popupWindow.document.close();
        console.log('Popup window created successfully');
      } else {
        console.error('Failed to create popup window');
      }
    }
  });

  // --------------------------
  // Initial Setup
  // --------------------------

  // Set an initial state 
  if (body) {
    body.dataset.state = body.dataset.state || 'farewell'; 
    toggleImages('farewell'); 
    updateSocialLinks('farewell'); 
  }

  // Initialize the slideshow (default to soonest events)
  initSlideshow();

  // Initialize hidden fields on page load
  updateHiddenFields();

  // Watch for body data-state changes and update hidden fields accordingly
  if (body) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "data-state") {
          updateHiddenFields();
        }
      }
    });
    observer.observe(document.body, { attributes: true });
  }
});

