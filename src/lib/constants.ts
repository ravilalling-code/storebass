export const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '51960759244';
export const ADMIN_NAME = process.env.NEXT_PUBLIC_ADMIN_NAME || 'Johan Tovar';

/**
 * Genera un enlace directo a WhatsApp con mensaje codificado
 */
export function getWhatsAppLink(message?: string): string {
  const phone = WHATSAPP_PHONE.replace(/[^0-9]/g, '');
  if (!message) {
    return `https://wa.me/${phone}`;
  }
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
