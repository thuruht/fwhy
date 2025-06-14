/**
 * Cloudflare Worker for Howdy/Farewell Gallery
 * Supports uploads, OCR processing, programmatic extraction of event data, and listing of flyers.
 */
export default {
  async fetch(request, env) {
    try {
      // Immediately handle preflight OPTIONS requests.
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": getAllowedOrigin(request),
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          },
        });
      }

      const url = new URL(request.url);
      const { pathname, searchParams } = url;

      if (pathname === '/upload' && request.method === 'POST') {
        return await handleUpload(request, env);
      } else if (pathname === '/batch-upload' && request.method === 'POST') {
        return await handleBatchUpload(request, env);
      } else if (pathname === '/ocr' && request.method === 'POST') {
        return await handleOcr(request, env);
      } else if (pathname === '/process-ocr' && request.method === 'POST') {
        return await handleProcessOcr(request, env);
      } else if (pathname.startsWith('/list/howdy') && request.method === 'GET') {
        return await handleList(request, env, 'howdy');
      } else if (pathname.startsWith('/list/farewell') && request.method === 'GET') {
        return await handleList(request, env, 'farewell');
      } else if (pathname.startsWith('/archives') && request.method === 'GET') {
        const type = searchParams.get('type') || 'howdy';
        return await handleArchives(request, env, type);
      } else {
        return createCorsResponse({ message: 'Not Found' }, 404, request);
      }
    } catch (err) {
      console.error(err);
      return createCorsResponse({ message: 'Internal Server Error' }, 500, request);
    }
  },
};

/**
 * Returns the allowed origin based on the request's Origin header.
 */
function getAllowedOrigin(request) {
  const allowedOrigins = ["https://fwhy.kcmo.xyz", "https://farewellcafe.com"];
  const requestOrigin = request.headers.get("Origin");
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowedOrigins[0];
}

/**
 * Helper function to create a CORS-enabled JSON response.
 */
function createCorsResponse(body, status = 200, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": getAllowedOrigin(request),
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    },
  });
}

/**
 * Handle POST /upload endpoint (Single Upload)
 */
async function handleUpload(request, env) {
  const formData = await request.formData();
  const password = formData.get("password");
  if (password !== env.UPLOAD_PASSWORD) {
    return createCorsResponse({ message: "Unauthorized: Invalid password." }, 401, request);
  }
  const type = formData.get("type");
  const title = formData.get("title");
  const date = formData.get("date");
  const time = formData.get("time") || "";
  const description = formData.get("description") || "";
  const file = formData.get("flyerFile");

  if (!type || !["howdy", "farewell"].includes(type)) {
    return createCorsResponse({ message: 'Invalid type. Must be "howdy" or "farewell".' }, 400, request);
  }
  if (!title || !date || !file) {
    return createCorsResponse({ message: "Missing required fields: type, title, date, flyerFile." }, 400, request);
  }
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return createCorsResponse({ message: "Unsupported file type. Allowed types: JPEG, PNG, GIF, WEBP." }, 400, request);
  }
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return createCorsResponse({ message: "File size exceeds the 5MB limit." }, 400, request);
  }
  const flyerId = crypto.randomUUID();
  const extension = getExtensionFromMime(file.type);
  const objectKey = `${type}/${flyerId}.${extension}`;

  try {
    await env.f3b.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type } });
  } catch (error) {
    console.error("Error storing image in R2:", error);
    return createCorsResponse({ message: "Failed to store image." }, 500, request);
  }
  const imageUrl = `${env.PUBLIC_R2_URL}/${objectKey}`;
  const insertSQL = `
    INSERT INTO flyers (id, type, title, description, date, time, imageUrl)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  try {
    await env.fyg3.prepare(insertSQL)
      .bind(flyerId, type, title, description, date, time, imageUrl)
      .run();
  } catch (error) {
    console.error("Error inserting metadata into D1:", error);
    await env.f3b.delete(objectKey);
    return createCorsResponse({ message: "Failed to store flyer metadata." }, 500, request);
  }
  return createCorsResponse({ success: true, flyerId, imageUrl }, 201, request);
}

/**
 * Helper: Get file extension based on MIME type.
 */
function getExtensionFromMime(mime) {
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[mime] || "png";
}

/**
 * Handle GET /list/{type} endpoint (Upcoming Flyers).
 */
async function handleList(request, env, flyerType) {
  const today = new Date().toISOString().slice(0, 10);
  const sql = `
    SELECT * 
    FROM flyers
    WHERE type = ? AND date >= ?
    ORDER BY date ASC
  `;
  try {
    const { results } = await env.fyg3.prepare(sql).bind(flyerType, today).all();
    return createCorsResponse(results, 200, request);
  } catch (error) {
    console.error("Error fetching flyers from D1:", error);
    return createCorsResponse({ message: "Failed to fetch flyers." }, 500, request);
  }
}

/**
 * Handle GET /archives?type={type} endpoint (Past Flyers).
 */
async function handleArchives(request, env, flyerType) {
  const today = new Date().toISOString().slice(0, 10);
  const sql = `
    SELECT * 
    FROM flyers
    WHERE type = ? AND date < ?
    ORDER BY date DESC
  `;
  try {
    const { results } = await env.fyg3.prepare(sql).bind(flyerType, today).all();
    return createCorsResponse(results, 200, request);
  } catch (error) {
    console.error("Error fetching archives from D1:", error);
    return createCorsResponse({ message: "Failed to fetch archives." }, 500, request);
  }
}

/**
 * Handle POST /ocr endpoint.
 * Accepts multipart/form-data with a "file" field.
 * Uses env.OCR_API_KEY to call OCR.space and returns the OCR result.
 * Ensures that a fallback is provided if no text is returned.
 */
async function handleOcr(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return createCorsResponse({ message: "No file provided" }, 400, request);
    }
    const ocrForm = new FormData();
    ocrForm.append('apikey', env.OCR_API_KEY);
    ocrForm.append('language', 'eng');
    ocrForm.append('isOverlayRequired', 'false');
    ocrForm.append('file', file);

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: 'POST',
      body: ocrForm,
    });
    const result = await response.json();

    // Ensure that if OCR returns no text, we have a fallback.
    if (
      !result ||
      !Array.isArray(result.ParsedResults) ||
      result.ParsedResults.length === 0 ||
      !result.ParsedResults[0].ParsedText ||
      result.ParsedResults[0].ParsedText.trim() === ""
    ) {
      result.ParsedResults = [{ ParsedText: "" }];
    }
    return createCorsResponse(result, 200, request);
  } catch (error) {
    console.error("OCR error:", error);
    return createCorsResponse({ message: "OCR failed" }, 500, request);
  }
}

/**
 * Programmatically extract event data from the OCR text.
 * - description: Full OCR text (top to bottom)
 * - time: Always prefilled as "Doors 7PM, 8PM Start"
 * - date: Extracts a date if found (using a simple regex)
 * - venue: Determines venue from keywords (without checking for "diy")
 */
function extractEventData(ocrText) {
  const data = {
    description: ocrText,
    time: "Doors 7PM, 8PM Start",
    date: "",
    venue: ""
  };

  // --- Extract Date ---
  // Look for a pattern like "20 FEBRUARY, 2025"
  const dateRegex = /(\d{1,2}\s+[A-Z]+\s*,?\s*\d{4})/i;
  const dateMatch = ocrText.match(dateRegex);
  if (dateMatch) {
    data.date = dateMatch[1].trim();
  } else if (ocrText.includes("2025")) {
    data.date = "2025";
  }

  // --- Determine Venue ---
  const lowerText = ocrText.toLowerCase();
  if (
    lowerText.includes("howdy") ||
    lowerText.includes("6523 stadium drive") ||
    lowerText.includes("all ages")
  ) {
    data.venue = "howdy";
  } else if (
    lowerText.includes("21+") ||
    lowerText.includes("farewell") ||
    lowerText.includes("6515 stadium drive")
  ) {
    data.venue = "farewell";
  } else {
    data.venue = "";
  }

  return data;
}

/**
 * Handle POST /process-ocr endpoint.
 * Accepts a JSON body with an "ocrText" field.
 * Programmatically extracts event data from the OCR text.
 */
async function handleProcessOcr(request, env) {
  try {
    const { ocrText } = await request.json();
    if (!ocrText) {
      return createCorsResponse({ message: "No OCR text provided." }, 400, request);
    }
    const extractedData = extractEventData(ocrText);
    return createCorsResponse(extractedData, 200, request);
  } catch (error) {
    console.error("Error in handleProcessOcr:", error);
    return createCorsResponse({ message: "Failed to process OCR text." }, 500, request);
  }
}

/**
 * Handle POST /batch-upload endpoint.
 * Processes multiple files and their metadata.
 */
async function handleBatchUpload(request, env) {
  try {
    const formData = await request.formData();
    const password = formData.get("password");
    if (password !== env.UPLOAD_PASSWORD) {
      return createCorsResponse({ message: "Unauthorized: Invalid password." }, 401, request);
    }
    const files = formData.getAll("flyerFiles");
    const titles = formData.getAll("titles");
    const dates = formData.getAll("dates");
    const times = formData.getAll("times");
    const descriptions = formData.getAll("descriptions");
    const types = formData.getAll("types");
    const count = files.length;
    if (
      titles.length !== count ||
      dates.length !== count ||
      times.length !== count ||
      descriptions.length !== count ||
      types.length !== count
    ) {
      return createCorsResponse({ message: "Mismatch in number of files and metadata fields." }, 400, request);
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const MAX_SIZE = 5 * 1024 * 1024;
    let results = [];
    for (let i = 0; i < count; i++) {
      const file = files[i];
      const title = titles[i];
      const date = dates[i];
      const time = times[i] || "";
      const description = descriptions[i] || "";
      const type = types[i];
      if (!type || !["howdy", "farewell"].includes(type)) {
        results.push({ index: i, success: false, message: "Invalid type" });
        continue;
      }
      if (!title || !date || !file) {
        results.push({ index: i, success: false, message: "Missing required fields" });
        continue;
      }
      if (!allowedTypes.includes(file.type)) {
        results.push({ index: i, success: false, message: "Unsupported file type" });
        continue;
      }
      if (file.size > MAX_SIZE) {
        results.push({ index: i, success: false, message: "File size exceeds limit" });
        continue;
      }
      const flyerId = crypto.randomUUID();
      const extension = getExtensionFromMime(file.type);
      const objectKey = `${type}/${flyerId}.${extension}`;
      try {
        await env.f3b.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type } });
      } catch (err) {
        results.push({ index: i, success: false, message: "Error storing image in R2" });
        continue;
      }
      const imageUrl = `${env.PUBLIC_R2_URL}/${objectKey}`;
      const insertSQL = `
        INSERT INTO flyers (id, type, title, description, date, time, imageUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      try {
        await env.fyg3.prepare(insertSQL)
          .bind(flyerId, type, title, description, date, time, imageUrl)
          .run();
        results.push({ index: i, success: true, flyerId, imageUrl });
      } catch (err) {
        await env.f3b.delete(objectKey);
        results.push({ index: i, success: false, message: "Error inserting metadata" });
      }
    }
    return createCorsResponse({ success: true, results }, 201, request);
  } catch (error) {
    console.error("Batch upload error:", error);
    return createCorsResponse({ message: "Batch upload failed" }, 500, request);
  }
}
