/**
 * payloadCrypto.js
 * Encrypts outgoing request payloads using btoa Base64 encoding
 * and decodes incoming response payloads using atob.
 */

/**
 * Encrypts object or string payload using btoa (UTF-8 safe)
 */
export function encryptPayload(data) {
  if (data === null || data === undefined) return data
  try {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data)
    // UTF-8 safe base64 encoding using btoa
    const base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode('0x' + p1)
    ))
    return base64
  } catch (err) {
    console.error('btoa encryption error:', err)
    return typeof data === 'string' ? data : JSON.stringify(data)
  }
}

/**
 * Decodes Base64 encoded payload using atob
 */
export function decryptPayload(encodedStr) {
  if (!encodedStr || typeof encodedStr !== 'string') return encodedStr
  try {
    const decodedStr = decodeURIComponent(
      Array.prototype.map.call(atob(encodedStr), c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    )
    try {
      return JSON.parse(decodedStr)
    } catch {
      return decodedStr
    }
  } catch (err) {
    return encodedStr
  }
}
