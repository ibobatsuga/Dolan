import { NextRequest, NextResponse } from 'next/server';
import { PICKUP_POINTS } from '@/lib/data/provinces';
import { searchMarketplaceVehicles, getStore } from '@/lib/store';
import { DurationHours, PackageType, RentalMode } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provinceSlug = searchParams.get('province') || 'jogja';
  const durationRaw = Number(searchParams.get('duration') || '12');
  const durationHours: DurationHours =
    durationRaw === 6 || durationRaw === 24 ? durationRaw : 12;

  const modeRaw = searchParams.get('mode');
  const mode: RentalMode =
    modeRaw === 'DENGAN_SOPIR' ? 'DENGAN_SOPIR' : 'LEPAS_KUNCI';

  const pkgRaw = searchParams.get('package');
  let packageType: PackageType =
    pkgRaw === 'FULL_BBM_DRIVER'
      ? 'FULL_BBM_DRIVER'
      : pkgRaw === 'WITH_DRIVER'
        ? 'WITH_DRIVER'
        : 'UNIT_ONLY';

  if (mode === 'LEPAS_KUNCI') packageType = 'UNIT_ONLY';
  if (mode === 'DENGAN_SOPIR' && packageType === 'UNIT_ONLY') {
    packageType = 'WITH_DRIVER';
  }

  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() + 1);
  defaultStart.setHours(9, 0, 0, 0);
  const startAtIso = searchParams.get('startAt') || defaultStart.toISOString();

  const pickupPointId = searchParams.get('pickupPointId') || 'pp-diy-yia';
  const transmission =
    (searchParams.get('transmission') as 'ALL' | 'MATIC' | 'MANUAL') || 'ALL';
  const minSeats = Number(searchParams.get('minSeats') || '0');
  const maxPrice = Number(searchParams.get('maxPrice') || '0');
  const freeDeliveryOnly = searchParams.get('freeDeliveryOnly') === 'true';

  const data = await searchMarketplaceVehicles({
    provinceSlug,
    startAtIso,
    durationHours,
    mode,
    packageType,
    pickupPointId,
    transmission,
    minSeats: minSeats > 0 ? minSeats : undefined,
    maxPrice: maxPrice > 0 ? maxPrice : undefined,
    freeDeliveryOnly,
  });

  const store = getStore();
  return NextResponse.json({
    ...data,
    provinces: store.provinces,
    pickupPoints: PICKUP_POINTS.filter((p) => p.provinceId === data.province.id),
  });
}
