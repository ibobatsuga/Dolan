export type ProvinceStatus = 'ACTIVE' | 'PILOT_READY' | 'EXPANSION_PLANNED';

export type DurationHours = 6 | 12 | 24;

export type RentalMode = 'LEPAS_KUNCI' | 'DENGAN_SOPIR';

export type PackageType = 'UNIT_ONLY' | 'WITH_DRIVER' | 'FULL_BBM_DRIVER';

export type VehicleCategory = 'CITY_CAR' | 'MPV' | 'EXECUTIVE_MPV' | 'COMMUTER';

export type OperationalStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'MANUAL_BLOCK';

export type BlockType = 'BOOKING' | 'MANUAL_BLOCK' | 'MAINTENANCE' | 'POST_6H_BUFFER';

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'AWAITING_PARTNER'
  | 'CONFIRMED'
  | 'HANDOVER_READY'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'REPLACED';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type DocumentType = 'KTP' | 'SIM_A' | 'PASSPORT' | 'SIM_INTERNASIONAL';

export type LedgerEntryType =
  | 'DP'
  | 'SETTLEMENT'
  | 'DEPOSIT_HOLD'
  | 'DEPOSIT_RELEASE'
  | 'REFUND'
  | 'COMMISSION'
  | 'CLAIM'
  | 'PAYOUT';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface CityHub {
  id: string;
  provinceId: string;
  slug: string;
  name: string;
  isActive: boolean;
}

export interface PickupPoint {
  id: string;
  provinceId: string;
  cityHubId: string;
  name: string;
  nameEn: string;
  type: 'AIRPORT' | 'STATION' | 'CITY_CENTER' | 'HOTEL_ZONE' | 'PARTNER_OFFICE';
  lat: number;
  lng: number;
  freeWaitingMinutes: number;
  surchargeZoneCode: string;
  isActive: boolean;
}

export interface PlatformRegionConfig {
  provinceId: string;
  post6hBufferMinutes: number;
  overtimeGraceMinutes: number;
  overtimeRatePerHourPct: number;
  driverMaxWorkHoursPerDay: number;
  driverMinRestMinutes: number;
  partnerResponseSlaMinutes: number;
  dpProportionPct: number;
  platformCommissionPct: number;
  ocrAutoPassThreshold: number;
  osrmRatePerKm: number;
  osrmRatePerMinute: number;
  policyVersion: string;
}

export interface Province {
  id: string;
  slug: string;
  code: string;
  name: string;
  shortName: string;
  status: ProvinceStatus;
  center: LatLng;
  timezone: string;
  currency: string;
  geofenceBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  seoHeadlineId: string;
  seoHeadlineEn: string;
  popularCorridors: string[];
  config: PlatformRegionConfig;
}

export interface FullBbmTerms {
  wilayah: string;
  wilayahEn: string;
  maxKm: number;
  tollIncluded: boolean;
  parkingIncluded: boolean;
  driverMealIncluded: boolean;
  returnFuelRule: string;
  returnFuelRuleEn: string;
}

export interface SeasonalRule {
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  multiplierPct: number; // e.g., 25 for +25%
}

export type DurationRateMatrix = Partial<
  Record<DurationHours, Partial<Record<PackageType, number>>>
>;

export interface ListingRatePlan {
  id: string;
  vehicleId: string;
  offeredModes: RentalMode[];
  offeredDurations: DurationHours[];
  rates: DurationRateMatrix;
  fullBbmTerms?: FullBbmTerms;
  freeDeliveryHubIds: string[];
  zoneFees: Record<string, number>;
  overtimePerHour: number;
  depositAmount: number;
  termsLepasKunci: string;
  termsLepasKunciEn: string;
  termsDenganSopir: string;
  termsDenganSopirEn: string;
  seasonalRules: SeasonalRule[];
  version: number;
}

export interface PartnerProfile {
  id: string;
  provinceId: string;
  cityHubId: string;
  businessName: string;
  picName: string;
  address: string;
  phone: string;
  payoutBankMasked: string;
  agreementVersion: string;
  sanctionLevel: 0 | 1 | 2 | 3;
  verified: boolean;
  rating: number;
  completedTrips: number;
  responseRatePct: number;
}

export interface VehicleListing {
  id: string;
  slug: string;
  partnerId: string;
  provinceId: string;
  cityHubId: string;
  brandModel: string;
  category: VehicleCategory;
  year: number;
  transmission: 'MATIC' | 'MANUAL';
  fuelType: 'BENSIN' | 'DIESEL' | 'HYBRID';
  seats: number;
  luggage: number;
  plateMasked: string;
  photo: string;
  operationalStatus: OperationalStatus;
  gpsDeviceId?: string;
  hasGpsTracker: boolean;
  ratePlan: ListingRatePlan;
}

export interface AvailabilityBlock {
  id: string;
  vehicleId: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  blockType: BlockType;
  referenceId?: string;
  reason?: string;
}

export interface DriverProfile {
  id: string;
  partnerId: string;
  provinceId: string;
  name: string;
  phone: string;
  languages: string[];
  isActive: boolean;
}

export interface DriverAssignment {
  id: string;
  bookingId: string;
  driverId: string;
  startAt: string;
  endAt: string;
  minRestMinutes: number;
  status: 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_TRIP' | 'COMPLETED';
}

export interface RouteQuote {
  originName: string;
  destinationName: string;
  distanceKm: number;
  durationMinutes: number;
  deliveryFee: number;
  isFreeZone: boolean;
  source: 'OSRM_LIVE' | 'OSRM_ROUTE_ESTIMATE' | 'ZONE_FALLBACK';
  attribution: string;
}

export interface PriceBreakdown {
  baseRentalFee: number;
  seasonalSurcharge: number;
  seasonalLabel?: string;
  deliveryFee: number;
  depositAmount: number;
  rentalTotal: number; // base + seasonal + delivery
  dpAmount: number;
  remainingAtHandover: number;
  totalDueNow: number; // dpAmount + depositAmount (if lepas kunci escrow)
  platformCommission: number;
  partnerNetPayout: number;
}

export interface HandoverChecklist {
  id: string;
  bookingId: string;
  stage: 'PICKUP' | 'RETURN';
  fuelLevelPct: number;
  odometerKm: number;
  notes: string;
  photosCount: number;
  renterConfirmedAt?: string;
  partnerConfirmedAt?: string;
  watermarkTimestamp: string;
  locked: boolean;
}

export interface Booking {
  id: string;
  code: string;
  provinceId: string;
  renterId: string;
  renterName: string;
  renterPhone: string;
  vehicleId: string;
  partnerId: string;
  driverId?: string;
  durationHours: DurationHours;
  startAt: string;
  endAt: string;
  bufferEndAt: string;
  mode: RentalMode;
  packageType: PackageType;
  pickupPointId: string;
  pickupLocationName: string;
  gpsConsentAccepted: boolean;
  priceSnapshot: PriceBreakdown;
  packageSnapshot?: FullBbmTerms;
  routeQuote: RouteQuote;
  overtimeRulePerHour: number;
  policyVersion: string;
  status: BookingStatus;
  createdAt: string;
  partnerDeadlineAt: string;
  checklists: HandoverChecklist[];
}

export interface OcrVerificationResult {
  id: string;
  userId: string;
  userName: string;
  docType: DocumentType;
  maskedNumber: string;
  extractedName: string;
  extractedNumber: string;
  extractedExpiry: string;
  confidence: number;
  matchesInput: boolean;
  needsManualReview: boolean;
  status: VerificationStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface PaymentLedgerEntry {
  id: string;
  bookingId: string;
  bookingCode: string;
  provinceId: string;
  type: LedgerEntryType;
  amount: number;
  gateway: 'MIDTRANS' | 'XENDIT' | 'PLATFORM_ESCROW';
  gatewayRef: string;
  idempotencyKey: string;
  reconciled: boolean;
  reason: string;
  createdAt: string;
}

export interface GpsTelemetry {
  vehicleId: string;
  bookingId?: string;
  gpsDeviceId: string;
  lat: number;
  lng: number;
  speedKmh: number;
  isOnline: boolean;
  insideGeofence: boolean;
  lastUpdatedAt: string;
}

export interface GeofenceEvent {
  id: string;
  bookingId: string;
  bookingCode: string;
  vehicleId: string;
  provinceId: string;
  eventType: 'OUT_OF_GEOFENCE' | 'OVERDUE' | 'DEVICE_OFFLINE';
  severity: 'WARNING' | 'CRITICAL';
  detail: string;
  resolved: boolean;
  createdAt: string;
}

export interface ClaimDispute {
  id: string;
  bookingId: string;
  bookingCode: string;
  provinceId: string;
  filedByRole: 'RENTER' | 'PARTNER';
  category: 'DAMAGE' | 'OVERTIME' | 'BBM_EXCESS' | 'OUT_OF_ZONE' | 'NO_SHOW' | 'UNIT_SWAP';
  claimedAmount: number;
  approvedAmount?: number;
  description: string;
  status: 'OPEN' | 'RESOLVED' | 'APPEALED';
  decisionNote?: string;
  appealUsed: boolean;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  bookingCode: string;
  channel: 'WHATSAPP_CLOUD_API' | 'EMAIL_FALLBACK';
  recipient: string;
  template: string;
  status: 'SENT' | 'QUEUED_RETRY';
  createdAt: string;
}
