// New Simplified Batch Upload System
// Connects to the unified events system without AI/OCR functionality

document.addEventListener('DOMContentLoaded', function() {
  const WORKER_BASE_URL = 'https://fygw0.kcmo.xyz';
  const UNIFIED_EVENTS_URL = 'https://fygw0.kcmo.xyz/events';
  
  // This script is now primarily handled inline in batch.htm
  // This file serves as backup functionality and API helpers
  
  /**
   * Create event via unified events API
   * @param {Object} eventData - Event data object
   * @param {string} authToken - Authentication token
   */
  async function createEvent(eventData, authToken) {
    try {
      const response = await fetch(UNIFIED_EVENTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create event error:', error);
      throw error;
    }
  }
  
  /**
   * Upload file to gallery
   * @param {File} file - File to upload
   * @param {string} authToken - Authentication token
   */
  async function uploadFile(file, authToken) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'flyers');

      const response = await fetch(`${WORKER_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
  
  /**
   * Authenticate user
   * @param {string} password - Admin password
   */
  async function authenticate(password) {
    try {
      const response = await fetch(`${WORKER_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Login failed');
      }
      
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }
  
  // Export functions for global access
  window.BatchUpload = {
    createEvent,
    uploadFile,
    authenticate
  };
  
  console.log('Simplified batch upload system loaded');
});
