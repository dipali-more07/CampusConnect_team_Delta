/**
 * formatUserFriendlyError(errOrMsg, fallback)
 * Converts technical API error messages, object dumps, or network errors
 * into clean, user-friendly toast messages.
 */
export function formatUserFriendlyError(errOrMsg, fallback = 'Something went wrong. Please try again.') {
  if (!errOrMsg) return fallback

  let msg = errOrMsg

  if (typeof errOrMsg === 'object' && errOrMsg !== null) {
    if (errOrMsg.message) msg = errOrMsg.message
    else if (errOrMsg.detail) msg = errOrMsg.detail
    else if (Array.isArray(errOrMsg)) {
      msg = errOrMsg.map(e => (typeof e === 'object' ? e.msg || e.message : String(e))).join(', ')
    }
  }

  if (Array.isArray(msg)) {
    msg = msg.map(e => (typeof e === 'object' ? e.msg || e.message : String(e))).join(', ')
  }

  msg = String(msg).trim()

  // Clean up raw JSON dumps
  if (msg.startsWith('{') || msg.startsWith('[')) {
    try {
      const parsed = JSON.parse(msg)
      if (parsed.message) msg = parsed.message
      else if (parsed.detail) msg = parsed.detail
    } catch {}
  }

  // Friendly text translations for technical jargon
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Server unreachable')) {
    return 'Unable to connect to the server. Please check your internet connection.'
  }

  if (msg.includes('500') || msg.includes('Internal Server Error')) {
    return 'Something went wrong on our end. Please try again in a moment.'
  }

  if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('No authorization token provided')) {
    return 'Your session has expired or is invalid. Please log in again.'
  }

  if (msg.includes('403') || msg.includes('Forbidden')) {
    return 'You do not have permission to perform this action.'
  }

  if (msg.includes('Event check-in QR code can only be generated after the event has started')) {
    return 'Check-in QR code will be available once the event starts.'
  }

  return msg || fallback
}

export default formatUserFriendlyError
