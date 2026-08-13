/**
 * Safely encodes a string into Base64 (btoa).
 * Handles UTF-8 characters gracefully.
 */
export const encodeBase64 = (str) => {
  if (!str) return str;
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode('0x' + p1);
    }));
  } catch {
    return btoa(str);
  }
};
