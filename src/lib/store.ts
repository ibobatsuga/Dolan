import { CITY_HUBS, PICKUP_POINTS, PROVINCES } from './data/provinces';
import {
  SEED_ASSIGNMENTS,
  SEED_BLOCKS,
  SEED_BOOKINGS,
  SEED_DISPUTES,
  SEED_DRIVERS,
  SEED_GEOFENCE_EVENTS,
  SEED_GPS_POSITIONS,
  SEED_LEDGER,
  SEED_NOTIFICATIONS,
  SEED_OCR_QUEUE,
  SEED_PARTNERS,
  SEED_VEHICLES,
} from './data/seed';
import {
  calculateCancellationImpact,
  calculateExtendQuote,
  calculateFinalPrice,
  checkVehicleAvailability,
  getRateForSelection,
  validateDriverAssignment,
} from './domain/rules';
import { getOsrmRouteQuote } from './integrations/osrm';
import {
  createIdempotentLedgerEntry,
  sendWhatsAppCloudNotification,
} from './integrations/payment-whatsapp';
import { runTesseractPreCheck } from './integrations/tesseract-ocr';
import { fetchTraccarPositions } from './integrations/traccar';
import {
  AvailabilityBlock,
  Booking,
  ClaimDispute,
  DocumentType,
  DriverAssignment,
  DriverProfile,
  DurationHours,
  GeofenceEvent,
  GpsTelemetry,
  NotificationLog,
  OcrVerificationResult,
  PackageType,
  PartnerProfile,
  PaymentLedgerEntry,
  PlatformRegionConfig,
  Province,
  ProvinceStatus,
  RentalMode,
  VehicleListing,
} from './types';

export interface MuvoStoreState {
  provinces: Province[];
  partners: PartnerProfile[];
  drivers: DriverProfile[];
  vehicles: VehicleListing[];
  blocks: AvailabilityBlock[];
  assignments: DriverAssignment[];
  bookings: Booking[];
  ocrQueue: OcrVerificationResult[];
  ledger: PaymentLedgerEntry[];
  gpsPositions: GpsTelemetry[];
  geofenceEvents: GeofenceEvent[];
  disputes: ClaimDispute[];
  notifications: NotificationLog[];
}

function cloneSeed(): MuvoStoreState {
  return structuredClone({
    provinces: PROVINCES,
    partners: SEED_PARTNERS,
    drivers: SEED_DRIVERS,
    vehicles: SEED_VEHICLES,
    blocks: SEED_BLOCKS,
    assignments: SEED_ASSIGNMENTS,
    bookings: SEED_BOOKINGS,
    ocrQueue: SEED_OCR_QUEUE,
    ledger: SEED_LEDGER,
    gpsPositions: SEED_GPS_POSITIONS,
    geofenceEvents: SEED_GEOFENCE_EVENTS,
    disputes: SEED_DISPUTES,
    notifications: SEED_NOTIFICATIONS,
  });
}

const globalForMuvo = globalThis as unknown as {
  __muvoStore?: MuvoStoreState;
};

export function getStore(): MuvoStoreState {
  if (!globalForMuvo.__muvoStore) {
    globalForMuvo.__muvoStore = cloneSeed();
  }
  return globalForMuvo.__muvoStore;
}

export function getProvinceConfig(provinceId: string): PlatformRegionConfig {
  const store = getStore();
  const prov = store.provinces.find((p) => p.id === provinceId) ?? store.provinces[0];
  return prov.config;
}

export async function searchMarketplaceVehicles(params: {
  provinceSlug?: string;
  startAtIso: string;
  durationHours: DurationHours;
  mode: RentalMode;
  packageType: PackageType;
  pickupPointId: string;
  transmission?: 'ALL' | 'MATIC' | 'MANUAL';
  minSeats?: number;
  maxPrice?: number;
  freeDeliveryOnly?: boolean;
}) {
  const store = getStore();
  const province =
    store.provinces.find((p) => p.slug === (params.provinceSlug || 'jogja')) ??
    store.provinces[0];

  const pickup =
    PICKUP_POINTS.find((pp) => pp.id === params.pickupPointId) ??
    PICKUP_POINTS.find((pp) => pp.provinceId === province.id) ??
    PICKUP_POINTS[0];

  const regionConfig = province.config;
  const vehiclesInProvince = store.vehicles.filter(
    (v) => v.provinceId === province.id
  );

  const results = await Promise.all(
    vehiclesInProvince.map(async (vehicle) => {
      const partner = store.partners.find((p) => p.id === vehicle.partnerId)!;
      const hub = CITY_HUBS.find((h) => h.id === vehicle.cityHubId);
      const partnerPickup =
        PICKUP_POINTS.find((pp) => pp.cityHubId === vehicle.cityHubId) ?? pickup;

      const routeQuote = await getOsrmRouteQuote({
        origin: { lat: partnerPickup.lat, lng: partnerPickup.lng },
        originName: partner.businessName,
        destination: pickup,
        freeDeliveryHubIds: vehicle.ratePlan.freeDeliveryHubIds,
        zoneFees: vehicle.ratePlan.zoneFees,
        regionConfig,
      });

      const rateAvailable =
        getRateForSelection(
          vehicle,
          params.durationHours,
          params.mode,
          params.packageType
        ) !== null;

      const availability = checkVehicleAvailability(
        vehicle.id,
        params.startAtIso,
        params.durationHours,
        store.blocks,
        regionConfig
      );

      const price = rateAvailable
        ? calculateFinalPrice({
            listing: vehicle,
            durationHours: params.durationHours,
            mode: params.mode,
            packageType: params.packageType,
            routeQuote,
            regionConfig,
            startAtIso: params.startAtIso,
          })
        : null;

      // Also build alternative durations/modes if exact requested combo is unavailable (UX Bab 17: never a dead end)
      const alternativeOptions: Array<{
        durationHours: DurationHours;
        mode: RentalMode;
        packageType: PackageType;
        baseRate: number;
      }> = [];

      if (!rateAvailable) {
        for (const dur of vehicle.ratePlan.offeredDurations) {
          for (const m of vehicle.ratePlan.offeredModes) {
            const pkg: PackageType = m === 'LEPAS_KUNCI' ? 'UNIT_ONLY' : 'WITH_DRIVER';
            const r = getRateForSelection(vehicle, dur, m, pkg);
            if (r !== null) {
              alternativeOptions.push({ durationHours: dur, mode: m, packageType: pkg, baseRate: r });
            }
          }
        }
      }

      return {
        vehicle,
        partner,
        hubName: hub?.name ?? '',
        routeQuote,
        price,
        rateAvailable,
        calendarAvailable: availability.available,
        conflictReason: availability.reason,
        endAt: availability.endAt,
        bufferEndAt: availability.bufferEndAt,
        alternativeOptions,
      };
    })
  );

  // Apply non-availability attribute filters
  const filtered = results.filter((item) => {
    if (params.transmission && params.transmission !== 'ALL') {
      if (item.vehicle.transmission !== params.transmission) return false;
    }
    if (params.minSeats && item.vehicle.seats < params.minSeats) return false;
    if (params.freeDeliveryOnly && !item.routeQuote.isFreeZone) return false;
    if (params.maxPrice && item.price && item.price.rentalTotal > params.maxPrice) {
      return false;
    }
    return true;
  });

  // Sort: fully available exact matches first, then lowest final rentalTotal
  filtered.sort((a, b) => {
    const aExact = a.rateAvailable && a.calendarAvailable ? 0 : 1;
    const bExact = b.rateAvailable && b.calendarAvailable ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return (a.price?.rentalTotal ?? 99999999) - (b.price?.rentalTotal ?? 99999999);
  });

  return {
    province,
    pickup,
    items: filtered,
  };
}

export async function createMarketplaceBooking(input: {
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
  idempotencyKey: string;
  gateway: 'MIDTRANS' | 'XENDIT';
  ocrVerificationId?: string;
}): Promise<{ ok: boolean; error?: string; booking?: Booking }> {
  const store = getStore();
  const existingWithKey = store.ledger.find(
    (l) => l.idempotencyKey === `dp-${input.idempotencyKey}`
  );
  if (existingWithKey) {
    const existingBooking = store.bookings.find((b) => b.id === existingWithKey.bookingId);
    if (existingBooking) return { ok: true, booking: existingBooking };
  }

  const vehicle = store.vehicles.find((v) => v.id === input.vehicleId);
  if (!vehicle) return { ok: false, error: 'Unit kendaraan tidak ditemukan.' };

  const province = store.provinces.find((p) => p.id === vehicle.provinceId);
  if (!province) return { ok: false, error: 'Provinsi tidak ditemukan.' };
  if (province.status !== 'ACTIVE') {
    return {
      ok: false,
      error: `Wilayah ${province.name} masih dalam fase persiapan ekspansi. Booking aktif saat ini khusus DI Yogyakarta.`,
    };
  }

  const partner = store.partners.find((p) => p.id === vehicle.partnerId)!;
  const pickup =
    PICKUP_POINTS.find((pp) => pp.id === input.pickupPointId) ?? PICKUP_POINTS[0];
  const partnerPickup =
    PICKUP_POINTS.find((pp) => pp.cityHubId === vehicle.cityHubId) ?? pickup;

  if (input.mode === 'LEPAS_KUNCI' && !input.gpsConsentAccepted) {
    return {
      ok: false,
      error: 'Penyewa wajib menyetujui pelacakan GPS selama masa sewa untuk booking lepas kunci (FR-REN-12).',
    };
  }

  const avail = checkVehicleAvailability(
    vehicle.id,
    input.startAtIso,
    input.durationHours,
    store.blocks,
    province.config
  );
  if (!avail.available) {
    return { ok: false, error: avail.reason || 'Jadwal bentrok pada kalender unit.' };
  }

  const routeQuote = await getOsrmRouteQuote({
    origin: { lat: partnerPickup.lat, lng: partnerPickup.lng },
    originName: partner.businessName,
    destination: pickup,
    freeDeliveryHubIds: vehicle.ratePlan.freeDeliveryHubIds,
    zoneFees: vehicle.ratePlan.zoneFees,
    regionConfig: province.config,
  });

  const priceSnapshot = calculateFinalPrice({
    listing: vehicle,
    durationHours: input.durationHours,
    mode: input.mode,
    packageType: input.packageType,
    routeQuote,
    regionConfig: province.config,
    startAtIso: input.startAtIso,
  });
  if (!priceSnapshot) {
    return {
      ok: false,
      error: 'Durasi atau paket yang dipilih tidak ditawarkan oleh mitra untuk unit ini.',
    };
  }

  const bookingId = `bkg-${Date.now()}`;
  const code = `MVO-${province.code}-${String(Math.floor(1000 + Math.random() * 8999))}`;
  const deadline = new Date(
    Date.now() + province.config.partnerResponseSlaMinutes * 60 * 1000
  ).toISOString();

  // Auto-assign eligible driver if driver mode & one is available, else partner assigns
  let assignedDriverId: string | undefined;
  if (input.mode === 'DENGAN_SOPIR') {
    const candidate = store.drivers.find((d) => {
      if (d.partnerId !== partner.id || !d.isActive) return false;
      return validateDriverAssignment(
        d.id,
        input.startAtIso,
        avail.endAt,
        store.assignments,
        province.config.driverMinRestMinutes,
        province.config.driverMaxWorkHoursPerDay
      ).valid;
    });
    if (candidate) {
      assignedDriverId = candidate.id;
      store.assignments.push({
        id: `asg-${Date.now()}`,
        bookingId: code,
        driverId: candidate.id,
        startAt: input.startAtIso,
        endAt: avail.endAt,
        minRestMinutes: province.config.driverMinRestMinutes,
        status: 'ASSIGNED',
      });
    }
  }

  const booking: Booking = {
    id: bookingId,
    code,
    provinceId: province.id,
    renterId: `usr-${Date.now()}`,
    renterName: input.renterName,
    renterPhone: input.renterPhone,
    vehicleId: vehicle.id,
    partnerId: partner.id,
    driverId: assignedDriverId,
    durationHours: input.durationHours,
    startAt: input.startAtIso,
    endAt: avail.endAt,
    bufferEndAt: avail.bufferEndAt,
    mode: input.mode,
    packageType: input.packageType,
    pickupPointId: pickup.id,
    pickupLocationName: pickup.name,
    gpsConsentAccepted: input.gpsConsentAccepted,
    priceSnapshot,
    packageSnapshot:
      input.packageType === 'FULL_BBM_DRIVER' ? vehicle.ratePlan.fullBbmTerms : undefined,
    routeQuote,
    overtimeRulePerHour: vehicle.ratePlan.overtimePerHour,
    policyVersion: province.config.policyVersion,
    status: 'AWAITING_PARTNER',
    createdAt: new Date().toISOString(),
    partnerDeadlineAt: deadline,
    checklists: [],
  };

  store.bookings.unshift(booking);

  // Lock calendar atomically (booking + post-6h buffer if 6h)
  store.blocks.push({
    id: `blk-${Date.now()}`,
    vehicleId: vehicle.id,
    startAt: input.startAtIso,
    endAt: avail.endAt,
    blockType: 'BOOKING',
    referenceId: code,
    reason: `Booking ${code} (${input.durationHours} jam)`,
  });

  if (input.durationHours === 6 && avail.bufferEndAt > avail.endAt) {
    store.blocks.push({
      id: `blk-buf-${Date.now()}`,
      vehicleId: vehicle.id,
      startAt: avail.endAt,
      endAt: avail.bufferEndAt,
      blockType: 'POST_6H_BUFFER',
      referenceId: code,
      reason: `Paruh jam cuci & cek pasca-booking 6 jam (${province.config.post6hBufferMinutes} mnt)`,
    });
  }

  // Ledger entries (DP + Escrow Deposit Hold if Lepas Kunci)
  const dpRes = createIdempotentLedgerEntry(store.ledger, {
    bookingId: booking.id,
    bookingCode: booking.code,
    provinceId: province.id,
    type: 'DP',
    amount: priceSnapshot.dpAmount,
    gateway: input.gateway,
    gatewayRef: `${input.gateway}-${code}`,
    idempotencyKey: `dp-${input.idempotencyKey}`,
    reconciled: true,
    reason: `DP ${province.config.dpProportionPct}% booking ${code}`,
  });
  if (dpRes.created) store.ledger.unshift(dpRes.entry);

  if (priceSnapshot.depositAmount > 0) {
    const depRes = createIdempotentLedgerEntry(store.ledger, {
      bookingId: booking.id,
      bookingCode: booking.code,
      provinceId: province.id,
      type: 'DEPOSIT_HOLD',
      amount: priceSnapshot.depositAmount,
      gateway: 'PLATFORM_ESCROW',
      gatewayRef: `ESC-${code}`,
      idempotencyKey: `dep-${input.idempotencyKey}`,
      reconciled: true,
      reason: `Escrow deposit lepas kunci ${code}`,
    });
    if (depRes.created) store.ledger.unshift(depRes.entry);
  }

  // Fire non-blocking WhatsApp Cloud API notification
  const notif = await sendWhatsAppCloudNotification({
    bookingCode: code,
    recipientPhone: input.renterPhone,
    template: 'booking_dp_paid_awaiting_partner',
  });
  store.notifications.unshift(notif);

  return { ok: true, booking };
}

export function addManualCalendarBlock(input: {
  vehicleId: string;
  startAtIso: string;
  endAtIso: string;
  blockType: 'MANUAL_BLOCK' | 'MAINTENANCE';
  reason: string;
}): { ok: boolean; error?: string; block?: AvailabilityBlock } {
  const store = getStore();
  const vehicle = store.vehicles.find((v) => v.id === input.vehicleId);
  if (!vehicle) return { ok: false, error: 'Unit tidak ditemukan.' };
  const province = store.provinces.find((p) => p.id === vehicle.provinceId)!;

  // Check overlap against existing blocks
  const startMs = new Date(input.startAtIso).getTime();
  const endMs = new Date(input.endAtIso).getTime();
  if (endMs <= startMs) {
    return { ok: false, error: 'Jam selesai harus lebih besar dari jam mulai.' };
  }

  for (const existing of store.blocks.filter((b) => b.vehicleId === input.vehicleId)) {
    const exStart = new Date(existing.startAt).getTime();
    const exEnd = new Date(existing.endAt).getTime();
    if (startMs < exEnd && exStart < endMs) {
      return {
        ok: false,
        error: `Ditolak sistem (anti-double-book): bentrok dengan ${existing.blockType} (${existing.reason || existing.referenceId || 'terjadwal'}).`,
      };
    }
  }

  const block: AvailabilityBlock = {
    id: `blk-m-${Date.now()}`,
    vehicleId: input.vehicleId,
    startAt: input.startAtIso,
    endAt: input.endAtIso,
    blockType: input.blockType,
    reason: input.reason,
  };
  store.blocks.push(block);
  void province;
  return { ok: true, block };
}

export function assignDriver(input: {
  bookingCode: string;
  driverId: string;
}): { ok: boolean; error?: string; booking?: Booking } {
  const store = getStore();
  const booking = store.bookings.find((b) => b.code === input.bookingCode);
  if (!booking) return { ok: false, error: 'Booking tidak ditemukan.' };
  if (booking.mode === 'LEPAS_KUNCI') {
    return { ok: false, error: 'Booking lepas kunci tidak memerlukan penugasan sopir.' };
  }
  const province = store.provinces.find((p) => p.id === booking.provinceId)!;
  const check = validateDriverAssignment(
    input.driverId,
    booking.startAt,
    booking.endAt,
    store.assignments,
    province.config.driverMinRestMinutes,
    province.config.driverMaxWorkHoursPerDay,
    booking.code
  );

  if (!check.valid) {
    return { ok: false, error: check.reason };
  }

  store.assignments = store.assignments.filter((a) => a.bookingId !== booking.code);
  store.assignments.push({
    id: `asg-${Date.now()}`,
    bookingId: booking.code,
    driverId: input.driverId,
    startAt: booking.startAt,
    endAt: booking.endAt,
    minRestMinutes: province.config.driverMinRestMinutes,
    status: 'ASSIGNED',
  });
  booking.driverId = input.driverId;
  return { ok: true, booking };
}

export function respondPartnerBooking(input: {
  bookingCode: string;
  action: 'ACCEPT' | 'REJECT';
  reason?: string;
}): { ok: boolean; error?: string; booking?: Booking } {
  const store = getStore();
  const booking = store.bookings.find((b) => b.code === input.bookingCode);
  if (!booking) return { ok: false, error: 'Booking tidak ditemukan.' };

  if (input.action === 'ACCEPT') {
    booking.status = 'CONFIRMED';
    return { ok: true, booking };
  }

  booking.status = 'CANCELLED';
  // Free calendar blocks
  store.blocks = store.blocks.filter((b) => b.referenceId !== booking.code);
  const impact = calculateCancellationImpact(booking, 'PARTNER');
  const refundRes = createIdempotentLedgerEntry(store.ledger, {
    bookingId: booking.id,
    bookingCode: booking.code,
    provinceId: booking.provinceId,
    type: 'REFUND',
    amount: impact.refundAmount,
    gateway: 'PLATFORM_ESCROW',
    gatewayRef: `RFD-${booking.code}`,
    idempotencyKey: `rfd-partner-${booking.code}`,
    reconciled: true,
    reason: `Penolakan mitra (${input.reason || 'unit tidak siap'}): ${impact.ruleApplied}`,
  });
  if (refundRes.created) store.ledger.unshift(refundRes.entry);

  return { ok: true, booking };
}

export function extendExistingBooking(input: {
  bookingCode: string;
  targetDuration: DurationHours;
}): { ok: boolean; error?: string; booking?: Booking; additionalFee?: number } {
  const store = getStore();
  const booking = store.bookings.find((b) => b.code === input.bookingCode);
  if (!booking) return { ok: false, error: 'Booking tidak ditemukan.' };
  const vehicle = store.vehicles.find((v) => v.id === booking.vehicleId)!;
  const province = store.provinces.find((p) => p.id === booking.provinceId)!;

  const quote = calculateExtendQuote({
    booking,
    listing: vehicle,
    targetDuration: input.targetDuration,
    blocks: store.blocks,
    assignments: store.assignments,
    regionConfig: province.config,
  });

  if (!quote.allowed || !quote.newEndAt || !quote.newBufferEndAt) {
    return { ok: false, error: quote.reason };
  }

  booking.durationHours = input.targetDuration;
  booking.endAt = quote.newEndAt;
  booking.bufferEndAt = quote.newBufferEndAt;
  booking.priceSnapshot = {
    ...booking.priceSnapshot,
    baseRentalFee: booking.priceSnapshot.baseRentalFee + (quote.additionalFee ?? 0),
    rentalTotal: booking.priceSnapshot.rentalTotal + (quote.additionalFee ?? 0),
    remainingAtHandover:
      booking.priceSnapshot.remainingAtHandover + (quote.additionalFee ?? 0),
  };

  // Update blocks
  store.blocks = store.blocks.filter((b) => b.referenceId !== booking.code);
  store.blocks.push({
    id: `blk-ext-${Date.now()}`,
    vehicleId: booking.vehicleId,
    startAt: booking.startAt,
    endAt: quote.newEndAt,
    blockType: 'BOOKING',
    referenceId: booking.code,
    reason: `Perpanjangan ke ${input.targetDuration} jam`,
  });

  // Update driver assignment endAt if applicable
  const driverAsg = store.assignments.find((a) => a.bookingId === booking.code);
  if (driverAsg) driverAsg.endAt = quote.newEndAt;

  return { ok: true, booking, additionalFee: quote.additionalFee };
}

export function cancelExistingBooking(input: {
  bookingCode: string;
  cancelledBy: 'RENTER' | 'PARTNER' | 'PLATFORM';
}): { ok: boolean; error?: string; booking?: Booking; refundAmount?: number; ruleApplied?: string } {
  const store = getStore();
  const booking = store.bookings.find((b) => b.code === input.bookingCode);
  if (!booking) return { ok: false, error: 'Booking tidak ditemukan.' };
  if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
    return { ok: false, error: 'Booking sudah selesai atau dibatalkan sebelumnya.' };
  }

  const impact = calculateCancellationImpact(booking, input.cancelledBy);
  booking.status = 'CANCELLED';
  store.blocks = store.blocks.filter((b) => b.referenceId !== booking.code);
  store.assignments = store.assignments.filter((a) => a.bookingId !== booking.code);

  const refundRes = createIdempotentLedgerEntry(store.ledger, {
    bookingId: booking.id,
    bookingCode: booking.code,
    provinceId: booking.provinceId,
    type: 'REFUND',
    amount: impact.refundAmount,
    gateway: 'PLATFORM_ESCROW',
    gatewayRef: `RFD-${booking.code}`,
    idempotencyKey: `rfd-${booking.code}`,
    reconciled: true,
    reason: impact.ruleApplied,
  });
  if (refundRes.created) store.ledger.unshift(refundRes.entry);

  return {
    ok: true,
    booking,
    refundAmount: impact.refundAmount,
    ruleApplied: impact.ruleApplied,
  };
}

export function submitChecklist(input: {
  bookingCode: string;
  stage: 'PICKUP' | 'RETURN';
  fuelLevelPct: number;
  odometerKm: number;
  notes: string;
  actor: 'RENTER' | 'PARTNER';
}): { ok: boolean; error?: string; booking?: Booking } {
  const store = getStore();
  const booking = store.bookings.find((b) => b.code === input.bookingCode);
  if (!booking) return { ok: false, error: 'Booking tidak ditemukan.' };

  let checklist = booking.checklists.find((c) => c.stage === input.stage);
  const now = new Date().toISOString();

  if (!checklist) {
    checklist = {
      id: `chk-${Date.now()}`,
      bookingId: booking.id,
      stage: input.stage,
      fuelLevelPct: input.fuelLevelPct,
      odometerKm: input.odometerKm,
      notes: input.notes,
      photosCount: 4,
      watermarkTimestamp: now,
      locked: false,
    };
    booking.checklists.push(checklist);
  } else if (checklist.locked) {
    return {
      ok: false,
      error: 'Checklist sudah dikonfirmasi dua pihak dan dikunci permanen (FR-MIT-06).',
    };
  } else {
    checklist.fuelLevelPct = input.fuelLevelPct;
    checklist.odometerKm = input.odometerKm;
    checklist.notes = input.notes;
  }

  if (input.actor === 'RENTER') checklist.renterConfirmedAt = now;
  if (input.actor === 'PARTNER') checklist.partnerConfirmedAt = now;

  if (checklist.renterConfirmedAt && checklist.partnerConfirmedAt) {
    checklist.locked = true;
    if (input.stage === 'PICKUP') booking.status = 'ACTIVE';
    if (input.stage === 'RETURN') {
      booking.status = 'COMPLETED';
      const commRes = createIdempotentLedgerEntry(store.ledger, {
        bookingId: booking.id,
        bookingCode: booking.code,
        provinceId: booking.provinceId,
        type: 'COMMISSION',
        amount: booking.priceSnapshot.platformCommission,
        gateway: 'PLATFORM_ESCROW',
        gatewayRef: `COM-${booking.code}`,
        idempotencyKey: `com-${booking.code}`,
        reconciled: true,
        reason: `Komisi platform booking ${booking.code}`,
      });
      if (commRes.created) store.ledger.unshift(commRes.entry);

      const payRes = createIdempotentLedgerEntry(store.ledger, {
        bookingId: booking.id,
        bookingCode: booking.code,
        provinceId: booking.provinceId,
        type: 'PAYOUT',
        amount: booking.priceSnapshot.partnerNetPayout,
        gateway: 'PLATFORM_ESCROW',
        gatewayRef: `PAY-${booking.code}`,
        idempotencyKey: `pay-${booking.code}`,
        reconciled: true,
        reason: `Payout bersih ke mitra setelah pengembalian terkonfirmasi`,
      });
      if (payRes.created) store.ledger.unshift(payRes.entry);
    }
  }

  return { ok: true, booking };
}

export async function submitOcrDocument(input: {
  userName: string;
  docType: DocumentType;
  claimedNumber: string;
  claimedExpiry: string;
  simulateBlur?: boolean;
}) {
  const store = getStore();
  const diyConfig = getProvinceConfig('prov-diy');
  const result = await runTesseractPreCheck({
    userId: `usr-${Date.now()}`,
    userName: input.userName,
    docType: input.docType,
    claimedName: input.userName,
    claimedNumber: input.claimedNumber,
    claimedExpiry: input.claimedExpiry,
    simulateBlur: input.simulateBlur,
    ocrThreshold: diyConfig.ocrAutoPassThreshold,
  });
  store.ocrQueue.unshift(result);
  return result;
}

export function decideOcrDocument(input: {
  ocrId: string;
  decision: 'VERIFIED' | 'REJECTED';
  reason?: string;
  adminName: string;
}) {
  const store = getStore();
  const item = store.ocrQueue.find((o) => o.id === input.ocrId);
  if (!item) return null;
  item.status = input.decision;
  item.rejectionReason = input.reason;
  item.reviewedBy = input.adminName;
  item.reviewedAt = new Date().toISOString();
  return item;
}

export function resolveDisputeTicket(input: {
  disputeId: string;
  approvedAmount: number;
  decisionNote: string;
  depositAction: 'RELEASE_FULL' | 'DEDUCT_PARTIAL' | 'HOLD_FULL';
}) {
  const store = getStore();
  const dispute = store.disputes.find((d) => d.id === input.disputeId);
  if (!dispute) return null;

  dispute.approvedAmount = input.approvedAmount;
  dispute.decisionNote = input.decisionNote;
  dispute.status = 'RESOLVED';

  const booking = store.bookings.find((b) => b.code === dispute.bookingCode);
  if (booking && booking.priceSnapshot.depositAmount > 0) {
    const releaseAmt =
      input.depositAction === 'HOLD_FULL'
        ? 0
        : Math.max(0, booking.priceSnapshot.depositAmount - input.approvedAmount);
    const res = createIdempotentLedgerEntry(store.ledger, {
      bookingId: booking.id,
      bookingCode: booking.code,
      provinceId: booking.provinceId,
      type: 'DEPOSIT_RELEASE',
      amount: releaseAmt,
      gateway: 'PLATFORM_ESCROW',
      gatewayRef: `REL-${booking.code}`,
      idempotencyKey: `rel-${dispute.id}`,
      reconciled: true,
      reason: `Keputusan meja sengketa (${input.depositAction}): ${input.decisionNote}`,
    });
    if (res.created) store.ledger.unshift(res.entry);
  }

  return dispute;
}

export function updateProvinceSettings(input: {
  provinceId: string;
  status?: ProvinceStatus;
  configPatch?: Partial<PlatformRegionConfig>;
}) {
  const store = getStore();
  const prov = store.provinces.find((p) => p.id === input.provinceId);
  if (!prov) return null;
  if (input.status) prov.status = input.status;
  if (input.configPatch) {
    prov.config = { ...prov.config, ...input.configPatch };
  }
  return prov;
}

export function updateDriverTripStatus(input: {
  assignmentId: string;
  status: DriverAssignment['status'];
}) {
  const store = getStore();
  const asg = store.assignments.find((a) => a.id === input.assignmentId);
  if (!asg) return null;
  asg.status = input.status;
  return asg;
}

export async function getLiveTelemetry(provinceId: string) {
  const store = getStore();
  const province =
    store.provinces.find((p) => p.id === provinceId) ?? store.provinces[0];
  return fetchTraccarPositions(store.gpsPositions, province);
}

export function updateVehicleRatePlan(input: {
  vehicleId: string;
  offeredDurations: DurationHours[];
  rates: VehicleListing['ratePlan']['rates'];
  overtimePerHour: number;
  depositAmount: number;
}) {
  const store = getStore();
  const vehicle = store.vehicles.find((v) => v.id === input.vehicleId);
  if (!vehicle) return null;
  vehicle.ratePlan = {
    ...vehicle.ratePlan,
    offeredDurations: input.offeredDurations,
    rates: input.rates,
    overtimePerHour: input.overtimePerHour,
    depositAmount: input.depositAmount,
    version: vehicle.ratePlan.version + 1,
  };
  return vehicle;
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
