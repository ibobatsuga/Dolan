import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { isInsideProvinceGeofence } from '@/lib/integrations/traccar';

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as {
    deviceId: string;
    lat: number;
    lng: number;
    speedKmh?: number;
  };
  const store = getStore();
  const vehicle = store.vehicles.find((v) => v.gpsDeviceId === payload.deviceId);
  if (!vehicle) {
    return NextResponse.json({ ok: false, error: 'Device ID tidak terdaftar.' }, { status: 404 });
  }

  const province = store.provinces.find((p) => p.id === vehicle.provinceId)!;
  const inside = isInsideProvinceGeofence({ lat: payload.lat, lng: payload.lng }, province);

  const posIdx = store.gpsPositions.findIndex((p) => p.vehicleId === vehicle.id);
  const updatedPos = {
    vehicleId: vehicle.id,
    gpsDeviceId: payload.deviceId,
    lat: payload.lat,
    lng: payload.lng,
    speedKmh: payload.speedKmh ?? 0,
    isOnline: true,
    insideGeofence: inside,
    lastUpdatedAt: new Date().toISOString(),
  };

  if (posIdx >= 0) store.gpsPositions[posIdx] = updatedPos;
  else store.gpsPositions.push(updatedPos);

  if (!inside) {
    const activeBooking = store.bookings.find(
      (b) => b.vehicleId === vehicle.id && b.status === 'ACTIVE'
    );
    store.geofenceEvents.unshift({
      id: `geo-${Date.now()}`,
      bookingId: activeBooking?.id || 'unassigned',
      bookingCode: activeBooking?.code || vehicle.plateMasked,
      vehicleId: vehicle.id,
      provinceId: province.id,
      eventType: 'OUT_OF_GEOFENCE',
      severity: 'WARNING',
      detail: `Alert Traccar: ${vehicle.brandModel} terdeteksi di luar batas geofence ${province.name} (${payload.lat.toFixed(4)}, ${payload.lng.toFixed(4)}).`,
      resolved: false,
      createdAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, insideGeofence: inside });
}
