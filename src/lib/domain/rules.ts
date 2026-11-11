import {
  AvailabilityBlock,
  Booking,
  DriverAssignment,
  DurationHours,
  PackageType,
  PlatformRegionConfig,
  PriceBreakdown,
  RentalMode,
  RouteQuote,
  VehicleListing,
} from '../types';

export function computeEndTimes(
  startAtIso: string,
  durationHours: DurationHours,
  post6hBufferMinutes: number
): { endAt: string; bufferEndAt: string } {
  const start = new Date(startAtIso);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  // PRD FR-MIT-03 & Bab 14: 6h booking reserves a wash/inspect buffer after endAt
  const bufferMinutes = durationHours === 6 ? post6hBufferMinutes : 0;
  const bufferEnd = new Date(end.getTime() + bufferMinutes * 60 * 1000);
  return {
    endAt: end.toISOString(),
    bufferEndAt: bufferEnd.toISOString(),
  };
}

export function intervalsOverlap(
  aStartIso: string,
  aEndIso: string,
  bStartIso: string,
  bEndIso: string
): boolean {
  const aStart = new Date(aStartIso).getTime();
  const aEnd = new Date(aEndIso).getTime();
  const bStart = new Date(bStartIso).getTime();
  const bEnd = new Date(bEndIso).getTime();
  return aStart < bEnd && bStart < aEnd;
}

export function checkVehicleAvailability(
  vehicleId: string,
  startAtIso: string,
  durationHours: DurationHours,
  blocks: AvailabilityBlock[],
  regionConfig: PlatformRegionConfig,
  excludeBookingId?: string
): {
  available: boolean;
  conflictBlock?: AvailabilityBlock;
  reason?: string;
  endAt: string;
  bufferEndAt: string;
} {
  const { endAt, bufferEndAt } = computeEndTimes(
    startAtIso,
    durationHours,
    regionConfig.post6hBufferMinutes
  );

  const vehicleBlocks = blocks.filter(
    (b) => b.vehicleId === vehicleId && (!excludeBookingId || b.referenceId !== excludeBookingId)
  );

  for (const block of vehicleBlocks) {
    if (intervalsOverlap(startAtIso, bufferEndAt, block.startAt, block.endAt)) {
      const label =
        block.blockType === 'POST_6H_BUFFER'
          ? 'Paruh jam cuci & cek pasca-booking 6 jam'
          : block.blockType === 'MAINTENANCE'
            ? 'Jadwal servis berkala'
            : block.blockType === 'MANUAL_BLOCK'
              ? `Blokir manual mitra (${block.reason || 'keperluan armada'})`
              : `Booking aktif (${block.referenceId || 'terjadwal'})`;

      return {
        available: false,
        conflictBlock: block,
        reason: `Bentrok kalender unit: ${label}`,
        endAt,
        bufferEndAt,
      };
    }
  }

  return { available: true, endAt, bufferEndAt };
}

export function validateDriverAssignment(
  driverId: string,
  startAtIso: string,
  endAtIso: string,
  assignments: DriverAssignment[],
  minRestMinutes: number,
  maxWorkHoursPerDay: number,
  excludeBookingId?: string
): { valid: boolean; reason?: string } {
  const reqStart = new Date(startAtIso).getTime();
  const reqEnd = new Date(endAtIso).getTime();
  const reqHours = (reqEnd - reqStart) / (60 * 60 * 1000);

  if (reqHours > maxWorkHoursPerDay && reqHours <= 24) {
    // 24h driver booking requires partner multi-shift note or is flagged if exceeding 12h continuous
  }

  const driverAssignments = assignments.filter(
    (a) => a.driverId === driverId && (!excludeBookingId || a.bookingId !== excludeBookingId)
  );

  for (const existing of driverAssignments) {
    const exStart = new Date(existing.startAt).getTime();
    const exEnd = new Date(existing.endAt).getTime();

    if (reqStart < exEnd && exStart < reqEnd) {
      return {
        valid: false,
        reason: `Bentrok jadwal sopir dengan booking ${existing.bookingId}`,
      };
    }

    const gapBefore = (reqStart - exEnd) / (60 * 1000);
    const gapAfter = (exStart - reqEnd) / (60 * 1000);

    if (gapBefore >= 0 && gapBefore < minRestMinutes) {
      return {
        valid: false,
        reason: `Melanggar jeda istirahat minimum sopir (${Math.round(gapBefore)} mnt < ${minRestMinutes} mnt wajib sejak tugas sebelumnya).`,
      };
    }

    if (gapAfter >= 0 && gapAfter < minRestMinutes) {
      return {
        valid: false,
        reason: `Melanggar jeda istirahat minimum sopir sebelum tugas berikutnya (${Math.round(gapAfter)} mnt < ${minRestMinutes} mnt).`,
      };
    }
  }

  return { valid: true };
}

export function getRateForSelection(
  listing: VehicleListing,
  durationHours: DurationHours,
  mode: RentalMode,
  packageType: PackageType
): number | null {
  if (!listing.ratePlan.offeredModes.includes(mode)) return null;
  if (!listing.ratePlan.offeredDurations.includes(durationHours)) return null;
  if (mode === 'LEPAS_KUNCI' && packageType !== 'UNIT_ONLY') return null;
  if (mode === 'DENGAN_SOPIR' && packageType === 'UNIT_ONLY') return null;

  const durationRates = listing.ratePlan.rates[durationHours];
  if (!durationRates) return null;
  const amount = durationRates[packageType];
  return typeof amount === 'number' ? amount : null;
}

export function calculateFinalPrice(params: {
  listing: VehicleListing;
  durationHours: DurationHours;
  mode: RentalMode;
  packageType: PackageType;
  routeQuote: RouteQuote;
  regionConfig: PlatformRegionConfig;
  startAtIso: string;
}): PriceBreakdown | null {
  const { listing, durationHours, mode, packageType, routeQuote, regionConfig, startAtIso } =
    params;

  const baseRentalFee = getRateForSelection(listing, durationHours, mode, packageType);
  if (baseRentalFee === null) return null;

  const startDate = startAtIso.slice(0, 10);
  const matchingSeason = listing.ratePlan.seasonalRules.find(
    (rule) => startDate >= rule.startDate && startDate <= rule.endDate
  );

  const seasonalSurcharge = matchingSeason
    ? Math.round((baseRentalFee * matchingSeason.multiplierPct) / 100)
    : 0;

  const deliveryFee = routeQuote.isFreeZone ? 0 : routeQuote.deliveryFee;
  const rentalTotal = baseRentalFee + seasonalSurcharge + deliveryFee;

  // PRD Bab 9 & 14: Mode dengan sopir NEVER charges lepas kunci deposit!
  const depositAmount = mode === 'LEPAS_KUNCI' ? listing.ratePlan.depositAmount : 0;

  const dpAmount = Math.round((rentalTotal * regionConfig.dpProportionPct) / 100);
  const remainingAtHandover = rentalTotal - dpAmount;
  const totalDueNow = dpAmount + depositAmount;

  const platformCommission = Math.round(
    (rentalTotal * regionConfig.platformCommissionPct) / 100
  );
  const partnerNetPayout = rentalTotal - platformCommission;

  return {
    baseRentalFee,
    seasonalSurcharge,
    seasonalLabel: matchingSeason?.label,
    deliveryFee,
    depositAmount,
    rentalTotal,
    dpAmount,
    remainingAtHandover,
    totalDueNow,
    platformCommission,
    partnerNetPayout,
  };
}

export function calculateExtendQuote(params: {
  booking: Booking;
  listing: VehicleListing;
  targetDuration: DurationHours;
  blocks: AvailabilityBlock[];
  assignments: DriverAssignment[];
  regionConfig: PlatformRegionConfig;
}): {
  allowed: boolean;
  reason?: string;
  additionalFee?: number;
  newEndAt?: string;
  newBufferEndAt?: string;
} {
  const { booking, listing, targetDuration, blocks, assignments, regionConfig } = params;
  if (targetDuration <= booking.durationHours) {
    return { allowed: false, reason: 'Durasi perpanjangan harus lebih panjang dari durasi aktif.' };
  }

  const targetRate = getRateForSelection(
    listing,
    targetDuration,
    booking.mode,
    booking.packageType
  );
  if (targetRate === null) {
    return {
      allowed: false,
      reason: `Unit ini tidak menawarkan paket ${booking.packageType} untuk durasi ${targetDuration} jam.`,
    };
  }

  const avail = checkVehicleAvailability(
    booking.vehicleId,
    booking.startAt,
    targetDuration,
    blocks,
    regionConfig,
    booking.id
  );
  if (!avail.available) {
    return { allowed: false, reason: avail.reason };
  }

  if (booking.driverId) {
    const driverCheck = validateDriverAssignment(
      booking.driverId,
      booking.startAt,
      avail.endAt,
      assignments,
      regionConfig.driverMinRestMinutes,
      regionConfig.driverMaxWorkHoursPerDay,
      booking.id
    );
    if (!driverCheck.valid) {
      return { allowed: false, reason: driverCheck.reason };
    }
  }

  const currentBase = booking.priceSnapshot.baseRentalFee;
  const additionalFee = Math.max(0, targetRate - currentBase);

  return {
    allowed: true,
    additionalFee,
    newEndAt: avail.endAt,
    newBufferEndAt: avail.bufferEndAt,
  };
}

export function calculateCancellationImpact(
  booking: Booking,
  cancelledBy: 'RENTER' | 'PARTNER' | 'PLATFORM'
): {
  refundAmount: number;
  penaltyAmount: number;
  ruleApplied: string;
} {
  const paidDp = booking.priceSnapshot.dpAmount + booking.priceSnapshot.depositAmount;
  if (cancelledBy === 'PARTNER' || cancelledBy === 'PLATFORM') {
    return {
      refundAmount: paidDp,
      penaltyAmount: 0,
      ruleApplied: 'Pembatalan oleh mitra/platform: 100% DP + deposit dikembalikan & unit pengganti ditawarkan.',
    };
  }

  const hoursUntilStart =
    (new Date(booking.startAt).getTime() - Date.now()) / (60 * 60 * 1000);

  if (hoursUntilStart >= 24) {
    return {
      refundAmount: paidDp,
      penaltyAmount: 0,
      ruleApplied: 'Batal >= 24 jam sebelum ambil: refund penuh 100% DP & deposit.',
    };
  }

  if (hoursUntilStart >= 6) {
    const penalty = Math.round(booking.priceSnapshot.dpAmount * 0.5);
    return {
      refundAmount: paidDp - penalty,
      penaltyAmount: penalty,
      ruleApplied: 'Batal 6–24 jam sebelum ambil: potongan 50% DP; 100% deposit kembali.',
    };
  }

  const penalty = booking.priceSnapshot.dpAmount;
  return {
    refundAmount: booking.priceSnapshot.depositAmount,
    penaltyAmount: penalty,
    ruleApplied: 'Batal < 6 jam sebelum ambil: DP hangus sesuai kebijakan; 100% deposit kembali.',
  };
}
