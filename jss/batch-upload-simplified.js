document.addEventListener('DOMContentLoaded', () => {
  // Configuration
  const GALLERY_WORKER_URL = 'https://fygw0.kcmo.xyz';
  const EVENTS_WORKER_URL = 'https://fyevw0.kcmo.xyz'; // Events API endpoint
  const MAX_FILES = 20;
  
  // DOM Elements
  const authForm = document.getElementById('authForm');
  const authError = document.getElementById('authError');
  const uploadInterface = document.getElementById('uploadInterface');
  const flyerFiles = document.getElementById('flyerFiles');
  const previewGrid = document.getElementById('previewGrid');
  const batchControls = document.getElementById('batchControls');
  const uploadProgress = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  // State
  let isAuthenticated = false;
  let uploadItems = [];
  let uploadedCount = 0;
  
  // Authentication
  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    
    // Simple password check (in production, this should be server-side)
    if (password === 'farewell2025' || password === 'howdy2025') {
      isAuthenticated = true;
      document.querySelector('.auth-section').style.display = 'none';
      uploadInterface.style.display = 'block';
      authError.style.display = 'none';
    } else {
      authError.style.display = 'block';
    }
  });
  
  // File Selection
  flyerFiles.addEventListener('change', handleFileSelection);
  
  function handleFileSelection(event) {
    const files = Array.from(event.target.files);
    
    if (files.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} files allowed. Please select fewer files.`);
      return;
    }
    
    // Clear previous items
    uploadItems = [];
    previewGrid.innerHTML = '';
    uploadedCount = 0;
    updateProgress();
    
    // Process each file
    files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        createPreviewItem(file, index);
      }
    });
    
    if (uploadItems.length > 0) {
      batchControls.style.display = 'flex';
      uploadProgress.style.display = 'block';
    }
  }
  
  function createPreviewItem(file, index) {
    const itemId = `item_${index}`;
    const item = {
      id: itemId,
      file: file,
      venue: 'farewell',
      title: '',
      date: '',
      time: '',
      description: '',
      suggestedPrice: '',
      ticketLink: '',
      status: 'pending'
    };
    
    uploadItems.push(item);
    
    // Create preview element
    const previewDiv = document.createElement('div');
    previewDiv.className = 'preview-item';
    previewDiv.dataset.id = itemId;
    
    // Status indicator
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status-indicator status-pending';
    statusDiv.textContent = 'Pending';
    previewDiv.appendChild(statusDiv);
    
    // Image preview
    const img = document.createElement('img');
    img.className = 'preview-image';
    img.alt = 'Event flyer preview';
    previewDiv.appendChild(img);
    
    // Load image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // Event form
    const form = document.createElement('div');
    form.className = 'event-form';
    form.innerHTML = `
      <div class="form-row">
        <select class="venue-selector" data-field="venue">
          <option value="farewell">Farewell</option>
          <option value="howdy">Howdy</option>
        </select>
      </div>
      
      <input 
        type="text" 
        placeholder="Event Title *" 
        data-field="title" 
        required>
      
      <div class="form-row">
        <input 
          type="date" 
          data-field="date" 
          required>
        <input 
          type="time" 
          data-field="time" 
          placeholder="Time">
      </div>
      
      <textarea 
        placeholder="Event Description" 
        data-field="description" 
        rows="3"></textarea>
      
      <div class="form-row">
        <input 
          type="text" 
          placeholder="Suggested Price (e.g., $15, Free)" 
          data-field="suggestedPrice">
        <input 
          type="url" 
          placeholder="Ticket Purchase Link" 
          data-field="ticketLink">
      </div>
      
      <button class="upload-btn" onclick="uploadSingleItem('${itemId}')">
        Upload This Event
      </button>
    `;
    
    previewDiv.appendChild(form);
    
    // Add event listeners for form fields
    form.querySelectorAll('[data-field]').forEach(field => {
      field.addEventListener('change', (e) => {
        const fieldName = e.target.dataset.field;
        item[fieldName] = e.target.value;
      });
    });
    
    previewGrid.appendChild(previewDiv);
  }
  
  // Batch Controls
  document.getElementById('uploadAllBtn').addEventListener('click', uploadAllItems);
  document.getElementById('clearAllBtn').addEventListener('click', clearAllItems);
  document.getElementById('fillDatesBtn').addEventListener('click', autoFillDates);
  
  async function uploadSingleItem(itemId) {
    const item = uploadItems.find(i => i.id === itemId);
    if (!item || item.status === 'uploaded') return;
    
    // Validate required fields
    if (!item.title || !item.date) {
      alert('Event title and date are required.');
      return;
    }
    
    await uploadItem(item);
  }
  
  async function uploadAllItems() {
    const pendingItems = uploadItems.filter(item => item.status === 'pending');
    
    if (pendingItems.length === 0) {
      alert('No pending items to upload.');
      return;
    }
    
    // Validate all items have required fields
    const invalidItems = pendingItems.filter(item => !item.title || !item.date);
    if (invalidItems.length > 0) {
      alert(`${invalidItems.length} items are missing required fields (title, date). Please complete them first.`);
      return;
    }
    
    document.getElementById('uploadAllBtn').disabled = true;
    document.getElementById('uploadAllBtn').textContent = 'Uploading...';
    
    // Upload items sequentially to avoid overwhelming the server
    for (const item of pendingItems) {
      await uploadItem(item);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between uploads
    }
    
    document.getElementById('uploadAllBtn').disabled = false;
    document.getElementById('uploadAllBtn').textContent = '🚀 Upload All';
    
    alert('Batch upload completed!');
  }
  
  async function uploadItem(item) {
    const previewDiv = document.querySelector(`[data-id="${item.id}"]`);
    const statusDiv = previewDiv.querySelector('.status-indicator');
    const uploadBtn = previewDiv.querySelector('.upload-btn');
    
    // Update UI to show processing
    item.status = 'processing';
    previewDiv.classList.add('processing');
    statusDiv.className = 'status-indicator status-processing';
    statusDiv.textContent = 'Uploading...';
    uploadBtn.disabled = true;
    
    try {
      // Create FormData for the flyer upload
      const formData = new FormData();
      formData.append('flyer', item.file);
      formData.append('venue', item.venue);
      formData.append('title', item.title);
      formData.append('date', item.date);
      formData.append('time', item.time || '');
      formData.append('description', item.description || '');
      formData.append('suggestedPrice', item.suggestedPrice || '');
      formData.append('ticketLink', item.ticketLink || '');
      
      // Upload to gallery worker
      const uploadResponse = await fetch(`${GALLERY_WORKER_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }
      
      const uploadResult = await uploadResponse.json();
      
      // Create event entry
      const eventData = {
        title: item.title,
        date: item.date,
        time: item.time || '',
        venue: item.venue,
        description: item.description || '',
        suggestedPrice: item.suggestedPrice || '',
        ticketLink: item.ticketLink || '',
        flyerUrl: uploadResult.flyerUrl || '',
        flyerThumbnail: uploadResult.thumbnailUrl || '',
        source: 'batch_upload'
      };
      
      // Submit to events API
      const eventResponse = await fetch(`${EVENTS_WORKER_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
      
      if (!eventResponse.ok) {
        throw new Error(`Event creation failed: ${eventResponse.status}`);
      }
      
      // Success
      item.status = 'uploaded';
      previewDiv.classList.remove('processing');
      previewDiv.classList.add('uploaded');
      statusDiv.className = 'status-indicator status-uploaded';
      statusDiv.textContent = 'Uploaded ✓';
      uploadBtn.textContent = 'Uploaded ✓';
      uploadBtn.style.background = '#27ae60';
      
      uploadedCount++;
      updateProgress();
      
    } catch (error) {
      console.error('Upload error:', error);
      
      // Error state
      item.status = 'error';
      previewDiv.classList.remove('processing');
      statusDiv.className = 'status-indicator status-pending';
      statusDiv.textContent = 'Error ✗';
      statusDiv.style.background = '#e74c3c';
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Retry Upload';
      uploadBtn.style.background = '#e74c3c';
      
      alert(`Upload failed for "${item.title}": ${error.message}`);
    }
  }
  
  function clearAllItems() {
    if (confirm('Are you sure you want to clear all items?')) {
      uploadItems = [];
      previewGrid.innerHTML = '';
      uploadedCount = 0;
      updateProgress();
      batchControls.style.display = 'none';
      uploadProgress.style.display = 'none';
      flyerFiles.value = '';
    }
  }
  
  function autoFillDates() {
    const today = new Date();
    let currentDate = new Date(today);
    
    uploadItems.forEach((item, index) => {
      if (!item.date) {
        // Auto-fill with upcoming dates (today + index days)
        const date = new Date(currentDate);
        date.setDate(currentDate.getDate() + index);
        const dateString = date.toISOString().split('T')[0];
        
        item.date = dateString;
        const previewDiv = document.querySelector(`[data-id="${item.id}"]`);
        const dateInput = previewDiv.querySelector('[data-field="date"]');
        if (dateInput) {
          dateInput.value = dateString;
        }
      }
    });
    
    alert('Auto-filled empty dates with sequential upcoming dates.');
  }
  
  function updateProgress() {
    const total = uploadItems.length;
    const percentage = total > 0 ? (uploadedCount / total) * 100 : 0;
    
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${uploadedCount} of ${total} uploaded`;
  }
  
  // Global function for inline onclick handlers
  window.uploadSingleItem = uploadSingleItem;
});
