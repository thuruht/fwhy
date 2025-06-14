// Simplified Batch Upload Script - No AI/OCR
// This replaces the old AI-powered batch upload system

document.addEventListener('DOMContentLoaded', function() {
  // This file is now deprecated in favor of the inline script in batch.htm
  // All functionality has been moved to the simplified batch upload page
  console.warn('This batch-upload.js file is deprecated. Use batch.htm with inline script instead.');
});

// Legacy function stubs for compatibility
function extractTextFromImage() {
  console.warn('OCR/AI text extraction has been removed. Please use manual entry.');
  return Promise.resolve('');
}

function processOcrText() {
  console.warn('OCR text processing has been removed. Please use manual entry.');
  return Promise.resolve({});
}

function submitFlyers() {
  console.warn('Old batch upload system has been replaced. Use the new simplified batch uploader.');
}

// Export functions for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractTextFromImage,
    processOcrText,
    submitFlyers
  };
}
