import { NextRequest, NextResponse } from 'next/server';
import {
  getLiveTelemetry,
  getStore,
  resolveDisputeTicket,
  updateProvinceSettings,
} from '@/lib/store';
import { PlatformRegionConfig, ProvinceStatus } from '@/lib/types';

export async function GET() {
  const store = getStore();
  const telemetry = await getLiveTelemetry('prov-diy');

  return NextResponse.json({
    provinces: store.provinces,
    ocrQueue: store.ocrQueue,
    disputes: store.disputes,
    ledger: store.ledger,
    bookings: store.bookings,
    vehicles: store.vehicles,
    partners: store.partners,
    geofenceEvents: store.geofenceEvents,
    notifications: store.notifications,
    telemetry,
  });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as {
    action: 'UPDATE_PROVINCE' | 'RESOLVE_DISPUTE';
    provinceId?: string;
    status?: ProvinceStatus;
    configPatch?: Partial<PlatformRegionConfig>;
    disputeId?: string;
    approvedAmount?: number;
    decisionNote?: string;
    depositAction?: 'RELEASE_FULL' | 'DEDUCT_PARTIAL' | 'HOLD_FULL';
  };

  if (body.action === 'UPDATE_PROVINCE' && body.provinceId) {
    const prov = updateProvinceSettings({
      provinceId: body.provinceId,
      status: body.status,
      configPatch: body.configPatch,
    });
    if (!prov) {
      return NextResponse.json({ error: 'Provinsi tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, province: prov });
  }

  if (body.action === 'RESOLVE_DISPUTE' && body.disputeId) {
    const dispute = resolveDisputeTicket({
      disputeId: body.disputeId,
      approvedAmount: body.approvedAmount ?? 0,
      decisionNote: body.decisionNote || 'Diselesaikan oleh Admin Ops Muvo.',
      depositAction: body.depositAction || 'RELEASE_FULL',
    });
    if (!dispute) {
      return NextResponse.json({ error: 'Tiket sengketa tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, dispute });
  }

  return NextResponse.json({ ok: false, error: 'Aksi tidak valid.' }, { status: 400 });
}
