import { NextRequest, NextResponse } from 'next/server';
import { createMarketplaceBooking, getStore } from '@/lib/store';
import { DurationHours, PackageType, RentalMode } from '@/lib/types';

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    bookings: store.bookings,
    vehicles: store.vehicles,
    partners: store.partners,
    drivers: store.drivers,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      vehicleId: string;
      provinceId: string;
      renterName: string;
      renterPhone: string;
      renterEmail: string;
      durationHours: DurationHours;
      startAtIso: string;
      mode: RentalMode;
      packageType: PackageType;
      pickupPointId: string;
      gpsConsentAccepted: boolean;
      idempotencyKey?: string;
      gateway?: 'MIDTRANS' | 'XENDIT';
    };

    if (!body.vehicleId || !body.renterName || !body.renterPhone || !body.startAtIso) {
      return NextResponse.json(
        { ok: false, error: 'Data penyewa, unit, dan jam mulai wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await createMarketplaceBooking({
      ...body,
      idempotencyKey: body.idempotencyKey || `idem-${Date.now()}`,
      gateway: body.gateway || 'MIDTRANS',
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Gagal membuat booking.' },
      { status: 500 }
    );
  }
}
