document.addEventListener('DOMContentLoaded', () => {
  const batchUploadForm = document.getElementById('batchUploadForm');
  const fileInput = document.getElementById('flyerFiles');
  const previewContainer = document.getElementById('batchPreviewContainer');
  const GALLERY_WORKER_URL = 'https://fygw0.kcmo.xyz';

  let batchUploadItems = [];

  fileInput.addEventListener('change', handleBatchFileSelection);

  function handleBatchFileSelection(event) {
    const files = event.target.files;
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

      // Image preview
      const img = document.createElement('img');
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      card.appendChild(img);
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.readAsDataURL(file);

      // Venue selector
      const venueLabel = document.createElement('label');
      venueLabel.textContent = "Venue:";
      card.appendChild(venueLabel);
      const venueSelect = document.createElement('select');
      venueSelect.classList.add("preview-type");
      venueSelect.style.display = "block";
      venueSelect.style.marginTop = "8px";
      venueSelect.innerHTML = `<option value="howdy">Howdy</option><option value="farewell">Farewell</option>`;
      card.appendChild(venueSelect);

      // Event title
      const titleInput = document.createElement('input');
      titleInput.type = "text";
      titleInput.placeholder = "Event Title";
      titleInput.classList.add("preview-title");
      titleInput.style.display = "block";
      titleInput.style.marginTop = "8px";
      card.appendChild(titleInput);

      // Event date
      const dateInput = document.createElement('input');
      dateInput.type = "date";
      dateInput.classList.add("preview-date");
      dateInput.style.display = "block";
      dateInput.style.marginTop = "8px";
      card.appendChild(dateInput);

      // Event time
      const timeInput = document.createElement('input');
      timeInput.type = "text";
      timeInput.placeholder = "Event Time (e.g., 7:00 PM)";
      timeInput.classList.add("preview-time");
      timeInput.style.display = "block";
      timeInput.style.marginTop = "8px";
      card.appendChild(timeInput);

      // Description textarea
      const descTextarea = document.createElement('textarea');
      descTextarea.placeholder = "Description";
      descTextarea.classList.add("preview-description");
      descTextarea.style.display = "block";
      descTextarea.style.width = "100%";
      descTextarea.style.marginTop = "8px";
      card.appendChild(descTextarea);

      previewContainer.appendChild(card);

      // Call /ocr to get full OCR text and prefill description.
      extractTextFromImage(file).then((extractedText) => {
        descTextarea.value = extractedText;
        // Further process the text for structured data
        processOcrText(extractedText).then((parsed) => {
          if (parsed.venue) venueSelect.value = parsed.venue;
          if (parsed.date) dateInput.value = parsed.date;
          if (parsed.time) timeInput.value = parsed.time;
        });
      });
    });
  }

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

  batchUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const uploadData = new FormData();
    const password = document.getElementById('batchUploadPasswordField').value;
    uploadData.append('password', password);

    batchUploadItems.forEach((item, index) => {
      const card = document.querySelector(`.batch-preview[data-id="${item.id}"]`);
      if (!card) return;
      const title = card.querySelector('.preview-title').value;
      const date = card.querySelector('.preview-date').value;
      const time = card.querySelector('.preview-time').value;
      const description = card.querySelector('.preview-description').value;
      const venue = card.querySelector('.preview-type').value;
      uploadData.append(`flyerFiles[${index}]`, item.file);
      uploadData.append(`titles[${index}]`, title);
      uploadData.append(`dates[${index}]`, date);
      uploadData.append(`times[${index}]`, time);
      uploadData.append(`descriptions[${index}]`, description);
      uploadData.append(`types[${index}]`, venue);
    });

    try {
      const response = await fetch(batchUploadForm.action, {
        method: 'POST',
        body: uploadData,
      });
      const result = await response.json();
      if (response.ok && result.success) {
        alert('Batch upload successful!');
        batchUploadForm.reset();
        previewContainer.innerHTML = "";
      } else {
        alert(`Batch upload failed: ${result.message || 'Unknown error.'}`);
      }
    } catch (error) {
      console.error('Batch upload failed:', error);
      alert(`Batch upload error: ${error.message}`);
    }
  });
});
