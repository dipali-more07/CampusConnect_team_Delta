/**
 * fetchInterceptor.js
 * Intercepts all global fetch requests to append the 'ngrok-skip-browser-warning': 'true' header
 * and globally obfuscate request payloads (POST/PUT/PATCH/DELETE) targeting API_BASE.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const originalFetch = window.fetch;

// Helper for Base64 UTF-8 Encoding
const encodePayload = (data) => {
  if (!data) return data;
  try {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    return btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode('0x' + p1);
    }));
  } catch {
    return btoa(typeof data === 'string' ? data : JSON.stringify(data));
  }
};

function setNgrokHeaderInRequest(resource) {
  try {
    resource.headers.set('ngrok-skip-browser-warning', 'true');
    return resource;
  } catch {
    // If Request headers are read-only, create a cloned Request with the new header
    try {
      const newHeaders = new Headers(resource.headers);
      newHeaders.set('ngrok-skip-browser-warning', 'true');
      return new Request(resource, { headers: newHeaders });
    } catch {
      // Fallback: continue with original request if cloning fails
      return resource;
    }
  }
}

function setNgrokHeaderInOptions(options) {
  const opts = options || {};
  if (!opts.headers) {
    opts.headers = {};
  }

  if (opts.headers instanceof Headers) {
    opts.headers.set('ngrok-skip-browser-warning', 'true');
  } else if (Array.isArray(opts.headers)) {
    // Find if header already exists, otherwise push
    const hasHeader = opts.headers.some(
      h => Array.isArray(h) && h[0]?.toLowerCase() === 'ngrok-skip-browser-warning'
    );
    if (!hasHeader) {
      opts.headers.push(['ngrok-skip-browser-warning', 'true']);
    }
  } else if (typeof opts.headers === 'object') {
    opts.headers = {
      ...opts.headers,
      'ngrok-skip-browser-warning': 'true'
    };
  }
  return opts;
}

window.fetch = async function (resource, options = {}) {
  // 1. Intercept Request Payload Obfuscation
  if (resource instanceof Request) {
    const url = resource.url;
    const method = resource.method.toLowerCase();
    
    if (API_BASE && url.startsWith(API_BASE) && ['post', 'put', 'patch', 'delete'].includes(method) && resource.body) {
      try {
        const contentType = (resource.headers.get('content-type') || '').toLowerCase();
        // Skip FormData / multipart/form-data
        if (!contentType.includes('multipart/form-data')) {
          const text = await resource.clone().text();
          let rawData = text;
          try {
            rawData = JSON.parse(text);
          } catch {
            // fallback if string is not valid JSON
          }
          
          const wrappedBody = JSON.stringify({
            payload: encodePayload(rawData)
          });
          
          resource = new Request(resource, {
            body: wrappedBody,
            headers: resource.headers
          });
        }
      } catch (e) {
        console.error('Error obfuscating Request body:', e);
      }
    }
    
    // Set Ngrok header
    resource = setNgrokHeaderInRequest(resource);
  } else {
    const url = String(resource);
    const method = (options.method || 'GET').toLowerCase();
    
    if (API_BASE && url.startsWith(API_BASE) && ['post', 'put', 'patch', 'delete'].includes(method) && options.body) {
      // Skip FormData
      if (!(typeof FormData !== 'undefined' && options.body instanceof FormData)) {
        let rawData = options.body;
        try {
          if (typeof options.body === 'string') {
            rawData = JSON.parse(options.body);
          }
        } catch {
          // ignore parsing error
        }
        
        options.body = JSON.stringify({
          payload: encodePayload(rawData)
        });
      }
    }
    
    // Set Ngrok header
    options = setNgrokHeaderInOptions(options);
  }

  return originalFetch.call(this, resource, options);
};

