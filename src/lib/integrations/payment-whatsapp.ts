import { NotificationLog, PaymentLedgerEntry } from '../types';

/**
 * Meta WhatsApp Business Cloud API Adapter (PRD Bab 16 & Bab 23).
 * Unofficial QR/Baileys gateways (Evolution API, etc.) are explicitly rejected.
 * Failed notifications never cancel transactions: logged & queued for retry.
 */
export async function sendWhatsAppCloudNotification(params: {
  bookingCode: string;
  recipientPhone: string;
  template: string;
}): Promise<NotificationLog> {
  const token = process.env.META_WA_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;

  let status: 'SENT' | 'QUEUED_RETRY' = 'SENT';

  if (token && phoneNumberId) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: params.recipientPhone,
            type: 'template',
            template: { name: params.template, language: { code: 'id' } },
          }),
        }
      );
      if (!res.ok) status = 'QUEUED_RETRY';
    } catch {
      status = 'QUEUED_RETRY';
    }
  }

  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    bookingCode: params.bookingCode,
    channel: 'WHATSAPP_CLOUD_API',
    recipient: params.recipientPhone,
    template: params.template,
    status,
    createdAt: new Date().toISOString(),
  };
}

export function createIdempotentLedgerEntry(
  existingLedger: PaymentLedgerEntry[],
  entry: Omit<PaymentLedgerEntry, 'id' | 'createdAt'>
): { created: boolean; entry: PaymentLedgerEntry } {
  const duplicate = existingLedger.find(
    (item) => item.idempotencyKey === entry.idempotencyKey
  );
  if (duplicate) {
    return { created: false, entry: duplicate };
  }

  const createdEntry: PaymentLedgerEntry = {
    ...entry,
    id: `ldg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  return { created: true, entry: createdEntry };
}
