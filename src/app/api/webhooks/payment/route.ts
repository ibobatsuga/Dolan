import { NextRequest, NextResponse } from 'next/server';
import { createIdempotentLedgerEntry } from '@/lib/integrations/payment-whatsapp';
import { getStore } from '@/lib/store';

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as {
    bookingCode: string;
    gateway: 'MIDTRANS' | 'XENDIT';
    gatewayRef: string;
    idempotencyKey: string;
    amount: number;
    type: 'SETTLEMENT' | 'REFUND';
  };

  const store = getStore();
  const booking = store.bookings.find((b) => b.code === payload.bookingCode);
  if (!booking) {
    return NextResponse.json({ ok: false, error: 'Booking tidak ditemukan.' }, { status: 404 });
  }

  const res = createIdempotentLedgerEntry(store.ledger, {
    bookingId: booking.id,
    bookingCode: booking.code,
    provinceId: booking.provinceId,
    type: payload.type,
    amount: payload.amount,
    gateway: payload.gateway,
    gatewayRef: payload.gatewayRef,
    idempotencyKey: payload.idempotencyKey,
    reconciled: true,
    reason: `Webhook terverifikasi dari ${payload.gateway}`,
  });

  if (res.created) {
    store.ledger.unshift(res.entry);
  }

  return NextResponse.json({ ok: true, duplicate: !res.created, entry: res.entry });
}
