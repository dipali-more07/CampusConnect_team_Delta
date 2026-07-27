import studentService from '../services/studentService'

/**
 * Dynamically loads Razorpay Checkout SDK script
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Handles end-to-end Razorpay / Mock Payment flow
 */
export async function processRazorpayPayment({
  payment_id,
  transaction_id,
  amount,
  eventTitle = 'Event Registration',
  userEmail = '',
  userName = '',
  userPhone = '',
  onSuccess,
  onError,
}) {
  const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || ''
  const hasValidKey = razorpayKey && razorpayKey !== 'rzp_test_placeholder' && razorpayKey.startsWith('rzp_')
  const isMockOrder = !transaction_id || transaction_id.startsWith('order_mock') || USE_MOCK || !hasValidKey

  if (isMockOrder) {
    const mockOrder = transaction_id || `order_mock_${Math.random().toString(36).substring(2, 9)}`
    const confirmRes = await studentService.confirmPayment(payment_id, {
      transaction_id: mockOrder,
      razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 9)}`,
      razorpay_order_id: mockOrder,
      razorpay_signature: `sig_mock_${Math.random().toString(36).substring(2, 9)}`
    })
    if (confirmRes.success) {
      onSuccess && onSuccess(confirmRes)
    } else {
      onError && onError(confirmRes.message || 'Mock payment confirmation failed.')
    }
    return
  }

  // Real Razorpay Flow
  const loaded = await loadRazorpayScript()
  if (!loaded) {
    onError && onError('Razorpay SDK failed to load. Please check internet connection.')
    return
  }

  const options = {
    key: razorpayKey,
    amount: Math.round((amount || 0) * 100),
    currency: 'INR',
    name: 'CampusConnect',
    description: `Payment for ${eventTitle}`,
    order_id: transaction_id,
    prefill: {
      name: userName,
      email: userEmail,
      contact: userPhone,
    },
    theme: {
      color: '#6366f1'
    },
    handler: async function (response) {
      const confirmRes = await studentService.confirmPayment(payment_id, {
        transaction_id: transaction_id || response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature
      })
      if (confirmRes.success) {
        onSuccess && onSuccess(confirmRes)
      } else {
        onError && onError(confirmRes.message || 'Payment verification failed.')
      }
    },
    modal: {
      ondismiss: async function () {
        try {
          if (payment_id) await studentService.failPayment(payment_id)
        } catch (_e) {}
        onError && onError('Payment was cancelled by user.')
      }
    }
  }

  try {
    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', async function (response) {
      try {
        if (payment_id) await studentService.failPayment(payment_id)
      } catch (_e) {}
      onError && onError(response.error?.description || 'Payment failed.')
    })
    rzp.open()
  } catch (err) {
    onError && onError('Failed to open Razorpay payment modal.')
  }
}
