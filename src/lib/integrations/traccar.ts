import { GpsTelemetry, LatLng, Province } from '../types';

export function isInsideProvinceGeofence(point: LatLng, province: Province): boolean {
  const { north, south, east, west } = province.geofenceBounds;
  return point.lat <= north && point.lat >= south && point.lng <= east && point.lng >= west;
}

export async function fetchTraccarPositions(
  fallbackPositions: GpsTelemetry[],
  province: Province
): Promise<{ source: 'TRACCAR_LIVE' | 'TRACCAR_PILOT_FEED'; positions: GpsTelemetry[] }> {
  const traccarBase = process.env.TRACCAR_BASE_URL;
  const traccarToken = process.env.TRACCAR_API_TOKEN;

  if (traccarBase && traccarToken) {
    try {
      const res = await fetch(`${traccarBase}/api/positions`, {
        headers: { Authorization: `Bearer ${traccarToken}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const items = (await res.json()) as Array<{
          deviceId: number;
          latitude: number;
          longitude: number;
          speed: number;
          fixTime: string;
        }>;
        const mapped: GpsTelemetry[] = items.map((item) => ({
          vehicleId: `traccar-${item.deviceId}`,
          gpsDeviceId: String(item.deviceId),
          lat: item.latitude,
          lng: item.longitude,
          speedKmh: Math.round(item.speed * 1.852),
          isOnline: true,
          insideGeofence: isInsideProvinceGeofence(
            { lat: item.latitude, lng: item.longitude },
            province
          ),
          lastUpdatedAt: item.fixTime,
        }));
        if (mapped.length > 0) {
          return { source: 'TRACCAR_LIVE', positions: mapped };
        }
      }
    } catch {
      // Fallback to pilot telemetry stream
    }
  }

  return {
    source: 'TRACCAR_PILOT_FEED',
    positions: fallbackPositions.map((p) => ({
      ...p,
      insideGeofence: isInsideProvinceGeofence({ lat: p.lat, lng: p.lng }, province),
    })),
  };
}
