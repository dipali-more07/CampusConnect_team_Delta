import { fetchWithAuth } from '../utils/apiClient'

/**
 * AI Service for CampusConnect AI Assistant (Camy)
 * Connects frontend widget to backend FastAPI / Express AI endpoints.
 */

const API_URL = import.meta.env.VITE_API_BASE_URL

const aiService = {
  /**
   * Send user message to Camy AI endpoint
   * @param {string} prompt - Current user message
   * @param {Array} history - Previous messages [{ role: 'user'|'assistant', content: string }]
   */
  async sendMessage(prompt, history = []) {
    try {
      const response = await fetchWithAuth(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          history: history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content || h.reply || '' }]
          }))
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        return {
          success: false,
          data: null,
          message: data.message || data.detail || 'Camy AI service unavailable right now.'
        }
      }

      const extractReply = (d) => {
        if (!d) return null
        if (typeof d === 'string') return d
        return (
          d.data?.reply ||
          d.data?.response ||
          d.data?.speech_text ||
          d.data?.text ||
          d.data?.answer ||
          d.data?.content ||
          d.reply ||
          d.response ||
          d.speech_text ||
          d.text ||
          d.answer ||
          d.content ||
          d.data?.message ||
          d.result ||
          (typeof d.message === 'string' && !d.message.toLowerCase().includes('success') ? d.message : null) ||
          null
        )
      }

      const replyText = extractReply(data) || 'I am ready to help you with campus events!'
      const resPayload = data.data || data

      return {
        success: true,
        data: {
          reply: replyText,
          speech_text: resPayload.speech_text || replyText,
          action_chips: resPayload.action_chips || resPayload.chips || data.action_chips || data.chips || [],
          recommended_events: resPayload.recommended_events || resPayload.events || data.recommended_events || data.events || [],
          user_context: resPayload.user_context || data.user_context || null
        }
      }
    } catch (err) {
      return {
        success: false,
        data: null,
        message: err.message || 'Network error connecting to Camy AI.'
      }
    }
  },

  /**
   * Fetch quick action chips based on user role and context
   */
  async getQuickActions() {
    try {
      const response = await fetchWithAuth(`${API_URL}/ai/quick-actions`, {
        method: 'GET'
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        return { success: false, chips: [], message: data.message || 'Could not fetch quick actions.' }
      }

      let chips = []
      if (Array.isArray(data)) {
        chips = data
      } else if (Array.isArray(data.data)) {
        chips = data.data
      } else if (Array.isArray(data.chips)) {
        chips = data.chips
      } else if (Array.isArray(data.data?.chips)) {
        chips = data.data.chips
      }

      return { success: true, chips }
    } catch (err) {
      return { success: false, chips: [], message: err.message }
    }
  },
}

export default aiService
