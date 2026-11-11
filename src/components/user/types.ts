import {
  Booking,
  DriverProfile,
  DurationHours,
  PackageType,
  PartnerProfile,
  PickupPoint,
  Province,
  RentalMode,
  RouteQuote,
  PriceBreakdown,
  VehicleListing,
} from '@/lib/types';

export type UserTab = 'home' | 'search' | 'wishlist' | 'bookings' | 'profile';

export type SortOption = 'recommended' | 'price_asc' | 'price_desc' | 'rating_desc' | 'nearest';

export interface MarketplaceSearchItem {
  vehicle: VehicleListing;
  partner: PartnerProfile;
  hubName: string;
  routeQuote: RouteQuote;
  price: PriceBreakdown | null;
  rateAvailable: boolean;
  calendarAvailable: boolean;
  conflictReason?: string;
  endAt: string;
  bufferEndAt: string;
  alternativeOptions: Array<{
    durationHours: DurationHours;
    mode: RentalMode;
    packageType: PackageType;
    baseRate: number;
  }>;
}

export interface SearchApiPayload {
  province: Province;
  pickup: PickupPoint;
  items: MarketplaceSearchItem[];
  provinces: Province[];
  pickupPoints: PickupPoint[];
}

export interface BookingListPayload {
  bookings: Booking[];
  vehicles: VehicleListing[];
  partners: PartnerProfile[];
  drivers: DriverProfile[];
}

export interface UserAccount {
  loggedIn: boolean;
  name: string;
  email: string;
  phone: string;
  ktpVerified: boolean;
  simVerified: boolean;
  memberTier: 'Muvo Silver' | 'Muvo Prioritas';
}

export interface SavedSearchItem {
  id: string;
  title: string;
  summary: string;
  provinceSlug: string;
  mode: RentalMode;
  duration: DurationHours;
  category: string;
  newMatches: number;
  active: boolean;
}

export interface UserNotificationItem {
  id: string;
  category: 'alert' | 'booking' | 'promo' | 'system';
  title: string;
  body: string;
  time: string;
  unread: boolean;
  bookingCode?: string;
}

export interface PartnerMessageThread {
  id: string;
  sender: string;
  role: 'Mitra Rental' | 'Muvo Support' | 'Sopir';
  verified: boolean;
  lastMessage: string;
  time: string;
  unreadCount: number;
}

export function formatRp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function categoryLabel(cat: VehicleListing['category'], lang: 'id' | 'en'): string {
  switch (cat) {
    case 'CITY_CAR':
      return 'City Car';
    case 'MPV':
      return lang === 'en' ? 'Family MPV' : 'MPV Keluarga';
    case 'EXECUTIVE_MPV':
      return 'Executive MPV';
    case 'COMMUTER':
      return lang === 'en' ? 'Group Commuter' : 'Commuter / Rombongan';
  }
}

export function brandFromModel(brandModel: string): string {
  return brandModel.split(' ')[0] || 'Muvo';
}
