import { NextRequest, NextResponse } from 'next/server';
import {
  addManualCalendarBlock,
  getLiveTelemetry,
  getStore,
  updateVehicleRatePlan,
} from '@/lib/store';
import { DurationHours, VehicleListing } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get('partnerId') || 'ptr-merapi';
  const store = getStore();

  const partner =
    store.partners.find((p) => p.id === partnerId) ?? store.partners[0];
  const vehicles = store.vehicles.filter((v) => v.partnerId === partner.id);
  const vehicleIds = new Set(vehicles.map((v) => v.id));
  const blocks = store.blocks.filter((b) => vehicleIds.has(b.vehicleId));
  const bookings = store.bookings.filter((b) => b.partnerId === partner.id);
  const drivers = store.drivers.filter((d) => d.partnerId === partner.id);
  const bookingCodes = new Set(bookings.map((b) => b.code));
  const ledger = store.ledger.filter((l) => bookingCodes.has(l.bookingCode));
  const telemetry = await getLiveTelemetry(partner.provinceId);

  return NextResponse.json({
    partner,
    allPartners: store.partners,
    vehicles,
    blocks,
    bookings,
    drivers,
    assignments: store.assignments,
    ledger,
    telemetry: {
      source: telemetry.source,
      positions: telemetry.positions.filter((p) => vehicleIds.has(p.vehicleId)),
    },
    geofenceEvents: store.geofenceEvents.filter((g) => vehicleIds.has(g.vehicleId)),
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    action: 'ADD_BLOCK' | 'UPDATE_RATES';
    vehicleId: string;
    startAtIso?: string;
    endAtIso?: string;
    blockType?: 'MANUAL_BLOCK' | 'MAINTENANCE';
    reason?: string;
    offeredDurations?: DurationHours[];
    rates?: VehicleListing['ratePlan']['rates'];
    overtimePerHour?: number;
    depositAmount?: number;
  };

  if (body.action === 'ADD_BLOCK') {
    if (!body.startAtIso || !body.endAtIso) {
      return NextResponse.json(
        { ok: false, error: 'Waktu mulai dan selesai wajib diisi.' },
        { status: 400 }
      );
    }
    const res = addManualCalendarBlock({
      vehicleId: body.vehicleId,
      startAtIso: body.startAtIso,
      endAtIso: body.endAtIso,
      blockType: body.blockType || 'MANUAL_BLOCK',
      reason: body.reason || 'Blokir manual mitra',
    });
    return NextResponse.json(res, { status: res.ok ? 201 : 409 });
  }

  if (body.action === 'UPDATE_RATES' && body.offeredDurations && body.rates) {
    const updated = updateVehicleRatePlan({
      vehicleId: body.vehicleId,
      offeredDurations: body.offeredDurations,
      rates: body.rates,
      overtimePerHour: body.overtimePerHour ?? 40000,
      depositAmount: body.depositAmount ?? 300000,
    });
    if (!updated) {
      return NextResponse.json({ ok: false, error: 'Unit tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, vehicle: updated });
  }

  return NextResponse.json({ ok: false, error: 'Aksi tidak dikenal.' }, { status: 400 });
}
