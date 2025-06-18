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
  const BASE_URL = 'https://fygw0.kcmo.xyz'; // Worker endpoint
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
   * Fetch upcoming or past flyers from the Worker.
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

      const url = showPast
        ? `${BASE_URL}/archives?type=${state}`
        : `${BASE_URL}/list/${state}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch flyers: ${response.statusText}`);
      }

      const data = await response.json();
      // Store in cache
      cache.set(cacheKey, { data, timestamp: now });
      return data;
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
   */
  async function initSlideshow() {
    const currentState = body?.dataset.state; // 'farewell' or 'howdy'
    const sortValue = sortSelect ? sortSelect.value : 'soonest'; // default to soonest if undefined

    const showPast = (sortValue === 'past'); // Decide if we fetch archives or upcoming
    allFlyers = await fetchFlyers(currentState, showPast);

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

        // Open the Mailchimp URL in a new tab or popup
        const email = encodeURIComponent(data.email);
        const mailchimpUrl = `https://mailchi.mp/eae4ec3932c9/farewell-email-signup-page?mc-EMAIL=${email}`;
        window.open(mailchimpUrl, '_blank', 'noopener,noreferrer');

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

