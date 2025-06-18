// @ts-nocheck
// --- Configuration Constants (Global Scope) ---
const BASE_URL = 'https://fygw0.kcmo.xyz';  // For general API calls
const GALLERY_WORKER_URL = 'https://fygw0.kcmo.xyz'; // For OCR/AI endpoints

// --- Modal and Batch Upload Code ---

const openAdminModalBtn = document.getElementById('openAdminModalBtn');
const adminUploadModal = document.getElementById('adminUploadModal');
const closeAdminModalBtn = document.getElementById('closeAdminModalBtn');

const adminPasswordPrompt = document.getElementById('adminPasswordPrompt');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const checkPasswordBtn = document.getElementById('checkPasswordBtn');
const batchUploadForm = document.getElementById('batchUploadForm');

// Show modal when uploader button is clicked.
if (openAdminModalBtn) {
  openAdminModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    adminUploadModal.style.display = 'flex';
  });
}

function closeAdminModal() {
  adminUploadModal.style.display = 'none';
  adminPasswordInput.value = '';
  adminPasswordPrompt.style.display = 'block';
  batchUploadForm.style.display = 'none';
}
if (closeAdminModalBtn) {
  closeAdminModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeAdminModal();
  });
}
adminUploadModal.addEventListener('click', (e) => {
  if (e.target === adminUploadModal) {
    closeAdminModal();
  }
});

if (checkPasswordBtn) {
  checkPasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const pass = adminPasswordInput.value.trim();
    if (!pass) {
      alert("Please enter the staff password!");
      return;
    }
    document.getElementById('singleUploadPasswordField').value = pass;
    document.getElementById('batchUploadPasswordField').value = pass;
    adminPasswordPrompt.style.display = 'none';
    document.getElementById('uploadTypeContainer').style.display = 'flex';
    // Show default single upload form.
    singleUploadForm.style.display = 'block';
    batchUploadForm.style.display = 'none';
  });
}

/**
 * Calls the /ocr endpoint with the file and returns the complete OCR text.
 */
async function extractTextFromImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await fetch(`${GALLERY_WORKER_URL}/ocr`, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (result?.ParsedResults?.length > 0) {
      return result.ParsedResults[0].ParsedText;
    }
  } catch (error) {
    console.error("OCR API error:", error);
  }
  return "";
}

/**
 * Calls the /process-ocr endpoint to extract structured event data.
 */
async function processOcrText(ocrText) {
  try {
    const response = await fetch(`${GALLERY_WORKER_URL}/process-ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ocrText }),
    });
    return await response.json();
  } catch (error) {
    console.error("Process OCR error:", error);
    return {};
  }
}

let batchUploadItems = [];

/**
 * Creates preview cards for each selected file in batch mode.
 * Each card shows an image preview and input fields for event data.
 * It pre-fills the description with the complete OCR text, then calls /process-ocr
 * to prefill date, time, and venue if available.
 */
function handleBatchFileSelection(event) {
  const files = event.target.files;
  const previewContainer = document.getElementById('batchPreviewContainer');
  previewContainer.innerHTML = "";
  batchUploadItems = [];

  Array.from(files).forEach((file, index) => {
    const itemId = index;
    batchUploadItems.push({ id: itemId, file: file });

    const card = document.createElement('div');
    card.classList.add('batch-preview');
    card.dataset.id = itemId;
    card.style.border = "1px solid #ccc";
    card.style.margin = "10px";
    card.style.padding = "10px";

    // Image preview.
    const img = document.createElement('img');
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    card.appendChild(img);
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.readAsDataURL(file);

    // Select field for venue type.
    const typeSelect = document.createElement('select');
    typeSelect.classList.add("preview-type");
    typeSelect.style.display = "block";
    typeSelect.style.marginTop = "8px";
    const optionHowdy = document.createElement('option');
    optionHowdy.value = "howdy";
    optionHowdy.textContent = "Howdy";
    const optionFarewell = document.createElement('option');
    optionFarewell.value = "farewell";
    optionFarewell.textContent = "Farewell";
    typeSelect.appendChild(optionHowdy);
    typeSelect.appendChild(optionFarewell);
    card.appendChild(typeSelect);

    // Input for event title.
    const titleInput = document.createElement('input');
    titleInput.type = "text";
    titleInput.placeholder = "Event Title";
    titleInput.classList.add("preview-title");
    titleInput.style.display = "block";
    titleInput.style.marginTop = "8px";
    card.appendChild(titleInput);

    // Input for event date.
    const dateInput = document.createElement('input');
    dateInput.type = "date";
    dateInput.classList.add("preview-date");
    dateInput.style.display = "block";
    dateInput.style.marginTop = "8px";
    card.appendChild(dateInput);

    // Input for event time.
    const timeInput = document.createElement('input');
    timeInput.type = "text";
    timeInput.placeholder = "Event Time (e.g., 7:00 PM)";
    timeInput.classList.add("preview-time");
    timeInput.style.display = "block";
    timeInput.style.marginTop = "8px";
    card.appendChild(timeInput);

    // Textarea for description.
    const descTextarea = document.createElement('textarea');
    descTextarea.placeholder = "Description";
    descTextarea.classList.add("preview-description");
    descTextarea.style.display = "block";
    descTextarea.style.width = "100%";
    descTextarea.style.marginTop = "8px";
    card.appendChild(descTextarea);

    previewContainer.appendChild(card);

    // First, retrieve the full OCR text.
    extractTextFromImage(file).then((extractedText) => {
      // Set the complete OCR text as the description.
      descTextarea.value = extractedText;
      // Then process the OCR text for structured data.
      processOcrText(extractedText).then((parsed) => {
        if (parsed.venue) {
          typeSelect.value = parsed.venue;
        }
        if (parsed.date) {
          dateInput.value = parsed.date;
        }
        if (parsed.time) {
          timeInput.value = parsed.time;
        }
      });
    });
  });
}

if (batchUploadForm) {
  const batchFileInput = batchUploadForm.querySelector('input[name="flyerFiles"]');
  if (batchFileInput) {
    batchFileInput.addEventListener('change', handleBatchFileSelection);
  }
}

const uploadTypeSelector = document.getElementById('uploadTypeSelector');
const singleUploadForm = document.getElementById('singleUploadForm');
if (uploadTypeSelector) {
  const radioButtons = uploadTypeSelector.querySelectorAll('input[name="uploadType"]');
  radioButtons.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.value === 'single') {
        singleUploadForm.style.display = 'block';
        batchUploadForm.style.display = 'none';
      } else if (radio.value === 'batch') {
        singleUploadForm.style.display = 'none';
        batchUploadForm.style.display = 'block';
      }
    });
  });
}

if (batchUploadForm) {
  batchUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const password = document.getElementById('batchUploadPasswordField').value;
    formData.append('password', password);

    batchUploadItems.forEach((item, index) => {
      const card = document.querySelector(`.batch-preview[data-id="${item.id}"]`);
      if (!card) return;
      const title = card.querySelector('.preview-title').value;
      const date = card.querySelector('.preview-date').value;
      const time = card.querySelector('.preview-time').value;
      const description = card.querySelector('.preview-description').value;
      const type = card.querySelector('.preview-type').value;
      formData.append(`flyerFiles[${index}]`, item.file);
      formData.append(`titles[${index}]`, title);
      formData.append(`dates[${index}]`, date);
      formData.append(`times[${index}]`, time);
      formData.append(`descriptions[${index}]`, description);
      formData.append(`types[${index}]`, type);
    });

    try {
      const response = await fetch(batchUploadForm.action, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (response.ok && result.success) {
        alert('Batch upload successful!');
        batchUploadForm.reset();
        document.getElementById('batchPreviewContainer').innerHTML = "";
      } else {
        alert(`Batch upload failed: ${result.message || 'Unknown error.'}`);
      }
    } catch (error) {
      console.error('Batch upload failed:', error);
      alert(`Batch upload error: ${error.message}`);
    }
  });
}
