import { NextRequest, NextResponse } from 'next/server';
import {
  assignDriver,
  cancelExistingBooking,
  extendExistingBooking,
  getStore,
  respondPartnerBooking,
  submitChecklist,
} from '@/lib/store';
import { DurationHours } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const store = getStore();
  const booking = store.bookings.find((b) => b.code === code);
  if (!booking) {
    return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
  }
  const vehicle = store.vehicles.find((v) => v.id === booking.vehicleId);
  const partner = store.partners.find((p) => p.id === booking.partnerId);
  const driver = booking.driverId
    ? store.drivers.find((d) => d.id === booking.driverId)
    : undefined;
  const province = store.provinces.find((p) => p.id === booking.provinceId);
  const ledger = store.ledger.filter((l) => l.bookingCode === booking.code);

  return NextResponse.json({ booking, vehicle, partner, driver, province, ledger });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const body = (await req.json()) as {
    action: 'EXTEND' | 'CANCEL' | 'PARTNER_RESPOND' | 'ASSIGN_DRIVER' | 'CHECKLIST';
    targetDuration?: DurationHours;
    cancelledBy?: 'RENTER' | 'PARTNER' | 'PLATFORM';
    partnerAction?: 'ACCEPT' | 'REJECT';
    reason?: string;
    driverId?: string;
    stage?: 'PICKUP' | 'RETURN';
    fuelLevelPct?: number;
    odometerKm?: number;
    notes?: string;
    actor?: 'RENTER' | 'PARTNER';
  };

  if (body.action === 'EXTEND' && body.targetDuration) {
    const res = extendExistingBooking({
      bookingCode: code,
      targetDuration: body.targetDuration,
    });
    return NextResponse.json(res, { status: res.ok ? 200 : 409 });
  }

  if (body.action === 'CANCEL') {
    const res = cancelExistingBooking({
      bookingCode: code,
      cancelledBy: body.cancelledBy || 'RENTER',
    });
    return NextResponse.json(res, { status: res.ok ? 200 : 409 });
  }

  if (body.action === 'PARTNER_RESPOND' && body.partnerAction) {
    const res = respondPartnerBooking({
      bookingCode: code,
      action: body.partnerAction,
      reason: body.reason,
    });
    return NextResponse.json(res, { status: res.ok ? 200 : 404 });
  }

  if (body.action === 'ASSIGN_DRIVER' && body.driverId) {
    const res = assignDriver({ bookingCode: code, driverId: body.driverId });
    return NextResponse.json(res, { status: res.ok ? 200 : 409 });
  }

  if (body.action === 'CHECKLIST' && body.stage) {
    const res = submitChecklist({
      bookingCode: code,
      stage: body.stage,
      fuelLevelPct: body.fuelLevelPct ?? 80,
      odometerKm: body.odometerKm ?? 25000,
      notes: body.notes ?? 'Kondisi baik',
      actor: body.actor || 'RENTER',
    });
    return NextResponse.json(res, { status: res.ok ? 200 : 409 });
  }

  return NextResponse.json({ ok: false, error: 'Aksi tidak valid.' }, { status: 400 });
}
