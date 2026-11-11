import { LatLng, PickupPoint, PlatformRegionConfig, RouteQuote } from '../types';

function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

export async function getOsrmRouteQuote(params: {
  origin: LatLng;
  originName: string;
  destination: PickupPoint;
  freeDeliveryHubIds: string[];
  zoneFees: Record<string, number>;
  regionConfig: PlatformRegionConfig;
}): Promise<RouteQuote> {
  const { origin, originName, destination, freeDeliveryHubIds, zoneFees, regionConfig } = params;
  const isFreeZone = freeDeliveryHubIds.includes(destination.cityHubId);

  const osrmBase = process.env.OSRM_BASE_URL;
  if (osrmBase) {
    try {
      const url = `${osrmBase}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (res.ok) {
        const data = (await res.json()) as {
          routes?: Array<{ distance: number; duration: number }>;
        };
        const route = data.routes?.[0];
        if (route) {
          const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
          const durationMinutes = Math.max(5, Math.round(route.duration / 60));
          const computedFee = isFreeZone
            ? 0
            : Math.round(
                (distanceKm * regionConfig.osrmRatePerKm +
                  durationMinutes * regionConfig.osrmRatePerMinute) /
                  5000
              ) * 5000;

          return {
            originName,
            destinationName: destination.name,
            distanceKm,
            durationMinutes,
            deliveryFee: computedFee,
            isFreeZone,
            source: 'OSRM_LIVE',
            attribution: 'OpenStreetMap / Project-OSRM',
          };
        }
      }
    } catch {
      // Fall through to deterministic road-network estimate or zone fallback
    }
  }

  // Deterministic road-route approximation when self-hosted OSRM is offline/unset
  const straightKm = haversineKm(origin, { lat: destination.lat, lng: destination.lng });
  if (!Number.isFinite(straightKm)) {
    const zoneFee = isFreeZone ? 0 : zoneFees[destination.surchargeZoneCode] ?? 50000;
    return {
      originName,
      destinationName: destination.name,
      distanceKm: 0,
      durationMinutes: 0,
      deliveryFee: zoneFee,
      isFreeZone,
      source: 'ZONE_FALLBACK',
      attribution: 'Estimasi Tarif Zona (OSRM fallback)',
    };
  }

  // Road tortuosity in Yogyakarta / Java corridors (~1.34x straight line)
  const distanceKm = Math.max(1.5, Math.round(straightKm * 1.34 * 10) / 10);
  const avgSpeedKmh = distanceKm > 25 ? 44 : 28;
  const durationMinutes = Math.max(8, Math.round((distanceKm / avgSpeedKmh) * 60));
  const rawFee =
    distanceKm * regionConfig.osrmRatePerKm + durationMinutes * regionConfig.osrmRatePerMinute;
  const deliveryFee = isFreeZone ? 0 : Math.max(25000, Math.round(rawFee / 5000) * 5000);

  return {
    originName,
    destinationName: destination.name,
    distanceKm,
    durationMinutes,
    deliveryFee,
    isFreeZone,
    source: 'OSRM_ROUTE_ESTIMATE',
    attribution: 'OpenStreetMap / OSRM Route Model',
  };
}
