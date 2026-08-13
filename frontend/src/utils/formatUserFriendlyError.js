/**
 * formatUserFriendlyError(errOrMsg, fallback)
 * Converts technical API error messages, object dumps, or network errors
 * into clean, user-friendly toast messages.
 */

/** Maps technical error patterns to user-friendly messages */
const ERROR_TRANSLATIONS = [
  {
    patterns: ['Failed to fetch', 'NetworkError', 'Server unreachable'],
    friendly: 'Unable to connect to the server. Please check your internet connection.',
  },
  {
    patterns: ['500', 'Internal Server Error'],
    friendly: 'Something went wrong on our end. Please try again in a moment.',
  },
  {
    patterns: ['401', 'Unauthorized', 'No authorization token provided'],
    friendly: 'Your session has expired or is invalid. Please log in again.',
  },
  {
    patterns: ['403', 'Forbidden'],
    friendly: 'You do not have permission to perform this action.',
  },
  {
    patterns: ['Event check-in QR code can only be generated after the event has started'],
    friendly: 'Check-in QR code will be available once the event starts.',
  },
]

function flattenArray(arr) {
  return arr.map(e => (typeof e === 'object' ? e.msg || e.message : String(e))).join(', ')
}

function extractMessageFromObject(obj) {
  if (obj.message) return obj.message
  if (obj.detail) return obj.detail
  if (Array.isArray(obj)) return flattenArray(obj)
  return obj
}

function tryParseJSON(str) {
  if (!str.startsWith('{') && !str.startsWith('[')) return str
  try {
    const parsed = JSON.parse(str)
    return parsed.message || parsed.detail || str
  } catch {
    return str
  }
}

function matchFriendlyMessage(msg) {
  for (const { patterns, friendly } of ERROR_TRANSLATIONS) {
    if (patterns.some(p => msg.includes(p))) return friendly
  }
  return null
}

export function formatUserFriendlyError(errOrMsg, fallback = 'Something went wrong. Please try again.') {
  if (!errOrMsg) return fallback

  let msg = errOrMsg

  if (typeof errOrMsg === 'object' && errOrMsg !== null) {
    msg = extractMessageFromObject(errOrMsg)
  }

  if (Array.isArray(msg)) {
    msg = flattenArray(msg)
  }

  msg = tryParseJSON(String(msg).trim())

  return matchFriendlyMessage(msg) || msg || fallback
}

export default formatUserFriendlyError
