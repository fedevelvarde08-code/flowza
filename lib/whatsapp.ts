// lib/whatsapp.ts

/**
 * Generates a WhatsApp click-to-chat URL
 * Works without WhatsApp API - just opens a pre-filled chat
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  // Remove non-numeric characters and ensure country code
  let cleaned = phone.replace(/\D/g, '')
  // Add India country code if not present
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned
  }
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${cleaned}?text=${encoded}`
}

export function buildLeadWhatsAppMessage(
  name: string,
  service: string,
  businessName: string
) {
  return `Hi ${name}, this is from ${businessName}. Thank you for your enquiry about ${service}. Would you like to schedule a quick call or visit to discuss the next step?`
}

 

export function buildPaymentWhatsAppMessage(name: string, pendingAmount: number): string {
  return `Hi ${name}, this is a reminder that ₹${pendingAmount.toLocaleString('en-IN')} is pending. Kindly complete the payment.`
}
