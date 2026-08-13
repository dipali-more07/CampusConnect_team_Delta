import { fetchWithAuth } from '../utils/apiClient'

/**
 * AI Service for CampusConnect AI Assistant (Camy)
 * Connects frontend widget to backend FastAPI / Express AI endpoints.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

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

      return {
        success: true,
        data: {
          reply: data.reply || data.response || data.text || 'I am ready to help you with campus events!',
          action_chips: data.action_chips || data.chips || [],
          recommended_events: data.recommended_events || data.events || [],
          user_context: data.user_context || null
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
