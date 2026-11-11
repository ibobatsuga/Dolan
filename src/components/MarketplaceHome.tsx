'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CarFront,
  CheckCircle2,
  Clock,
  GitCompareArrows,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  Booking,
  DurationHours,
  PackageType,
  PartnerProfile,
  RentalMode,
  VehicleCategory,
} from '@/lib/types';
import {
  brandFromModel,
  categoryLabel,
  formatRp,
  MarketplaceSearchItem,
  PartnerMessageThread,
  SavedSearchItem,
  SearchApiPayload,
  SortOption,
  UserAccount,
  UserNotificationItem,
  UserTab,
} from './user/types';
import { UserAuthModal } from './user/UserAuthModal';
import { FilterSheetModal } from './user/FilterSheetModal';
import { CompareDrawerModal } from './user/CompareDrawerModal';
import { PartnerProfileModal } from './user/PartnerProfileModal';
import { VehicleDetailModal } from './user/VehicleDetailModal';
import { BookingFlowModal } from './user/BookingFlowModal';
import {
  BookingsGarageHubView,
  ProfileHubView,
  WishlistHubView,
} from './user/UserHubViews';

interface MarketplaceHomeProps {
  initialProvince?: string;
  initialLang?: 'id' | 'en';
}

function defaultTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const INITIAL_SAVED_SEARCHES: SavedSearchItem[] = [
  {
    id: 'ss-1',
    title: 'City Tour Stasiun Tugu (12 Jam)',
    summary: 'City Car / MPV • Matic • Lepas Kunci',
    provinceSlug: 'jogja',
    mode: 'LEPAS_KUNCI',
    duration: 12,
    category: 'CITY_CAR',
    newMatches: 4,
    active: true,
  },
  {
    id: 'ss-2',
    title: 'Penjemputan Bandara YIA + Sopir',
    summary: 'Executive MPV • Full BBM • Gratis Antar',
    provinceSlug: 'jogja',
    mode: 'DENGAN_SOPIR',
    duration: 12,
    category: 'EXECUTIVE_MPV',
    newMatches: 3,
    active: true,
  },
];

const INITIAL_NOTIFICATIONS: UserNotificationItem[] = [
  {
    id: 'n-1',
    category: 'alert',
    title: 'Penurunan Tarif di Stasiun Tugu',
    body: 'Tarif Toyota Avanza paket 12 jam turun Rp 35.000 untuk keberangkatan besok pagi.',
    time: '10 menit lalu',
    unread: true,
  },
  {
    id: 'n-2',
    category: 'booking',
    title: 'Voucher MVO-DIY-2601 Siap Digunakan',
    body: 'Mitra siap mengantar unit di Bandara YIA. Jangan lupa cek checklist pickup.',
    time: '1 jam lalu',
    unread: true,
    bookingCode: 'MVO-DIY-2601',
  },
  {
    id: 'n-3',
    category: 'promo',
    title: 'Promo Akhir Pekan Jogja',
    body: 'Gratis antar-jemput zona Malioboro, Prawirotaman, dan Sleman Inti.',
    time: 'Kemarin',
    unread: false,
  },
];

const INITIAL_MESSAGES: PartnerMessageThread[] = [
  {
    id: 'm-1',
    sender: 'Mataram Rent Car Jogja',
    role: 'Mitra Rental',
    verified: true,
    lastMessage: 'Halo kak, unit sudah disiapkan & dibersihkan untuk jam 09:00 di Tugu.',
    time: '10:45 WIB',
    unreadCount: 1,
  },
  {
    id: 'm-2',
    sender: 'Muvo Support Jogja',
    role: 'Muvo Support',
    verified: true,
    lastMessage: 'Verifikasi KTP & SIM A kakak sudah disetujui untuk sewa Lepas Kunci.',
    time: 'Kemarin',
    unreadCount: 0,
  },
];

export function MarketplaceHome({
  initialProvince = 'jogja',
  initialLang = 'id',
}: MarketplaceHomeProps) {
  const [lang, setLang] = useState<'id' | 'en'>(initialLang);
  const [activeTab, setActiveTab] = useState<UserTab>('home');
  const [provinceSlug, setProvinceSlug] = useState(initialProvince);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [startDate, setStartDate] = useState(defaultTomorrowDate);
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState<DurationHours>(12);
  const [mode, setMode] = useState<RentalMode>('LEPAS_KUNCI');
  const [packageType, setPackageType] = useState<PackageType>('UNIT_ONLY');
  const [pickupPointId, setPickupPointId] = useState('pp-diy-yia');
  const [category, setCategory] = useState<'ALL' | VehicleCategory>('ALL');
  const [transmission, setTransmission] = useState<'ALL' | 'MATIC' | 'MANUAL'>('ALL');
  const [minSeats, setMinSeats] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000000);
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);
  const [gpsOnly, setGpsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  // Data payload
  const [payload, setPayload] = useState<SearchApiPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // User states
  const [account, setAccount] = useState<UserAccount>({
    loggedIn: false,
    name: 'Nadia Kusuma',
    email: 'nadia.kusuma@muvo.id',
    phone: '081299887766',
    ktpVerified: true,
    simVerified: true,
    memberTier: 'Muvo Prioritas',
  });
  const [wishlistIds, setWishlistIds] = useState<string[]>(['veh-diy-brio', 'veh-diy-avanza']);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>(INITIAL_SAVED_SEARCHES);
  const [notifications, setNotifications] =
    useState<UserNotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [sessionBookings, setSessionBookings] = useState<Booking[]>([]);
  const [aiTip, setAiTip] = useState<string | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<MarketplaceSearchItem | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [bookingItem, setBookingItem] = useState<MarketplaceSearchItem | null>(null);

  // Sync pickup default when province changes
  useEffect(() => {
    let active = true;
    const startAtIso = new Date(`${startDate}T${startTime}:00+07:00`).toISOString();
    const params = new URLSearchParams({
      province: provinceSlug,
      startAt: startAtIso,
      duration: String(duration),
      mode,
      package: packageType,
      pickupPointId,
      transmission,
      minSeats: String(minSeats),
      maxPrice: maxPrice < 2000000 ? String(maxPrice) : '0',
      freeDeliveryOnly: String(freeDeliveryOnly),
    });

    fetch(`/api/search?${params.toString()}`)
      .then((res) => res.json())
      .then((json: SearchApiPayload) => {
        if (!active) return;
        setPayload(json);
        if (
          json.pickupPoints.length > 0 &&
          !json.pickupPoints.some((p) => p.id === pickupPointId)
        ) {
          setPickupPointId(json.pickupPoints[0].id);
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    provinceSlug,
    startDate,
    startTime,
    duration,
    mode,
    packageType,
    pickupPointId,
    transmission,
    minSeats,
    maxPrice,
    freeDeliveryOnly,
  ]);

  const rawItems = useMemo(() => payload?.items ?? [], [payload]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = rawItems.filter((item) => {
      if (category !== 'ALL' && item.vehicle.category !== category) return false;
      if (gpsOnly && !item.vehicle.hasGpsTracker) return false;
      if (q) {
        const hay = `${item.vehicle.brandModel} ${item.partner.businessName} ${item.hubName} ${item.vehicle.transmission}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sortBy === 'price_asc') {
      sorted.sort(
        (a, b) => (a.price?.rentalTotal ?? 99999999) - (b.price?.rentalTotal ?? 99999999)
      );
    } else if (sortBy === 'price_desc') {
      sorted.sort((a, b) => (b.price?.rentalTotal ?? 0) - (a.price?.rentalTotal ?? 0));
    } else if (sortBy === 'rating_desc') {
      sorted.sort((a, b) => b.partner.rating - a.partner.rating);
    } else if (sortBy === 'nearest') {
      sorted.sort((a, b) => a.routeQuote.distanceKm - b.routeQuote.distanceKm);
    }
    return sorted;
  }, [rawItems, category, gpsOnly, searchQuery, sortBy]);

  const wishlistedItems = useMemo(
    () => rawItems.filter((item) => wishlistIds.includes(item.vehicle.id)),
    [rawItems, wishlistIds]
  );

  const compareItems = useMemo(
    () => rawItems.filter((item) => compareIds.includes(item.vehicle.id)),
    [rawItems, compareIds]
  );

  const activeProvince = payload?.province;
  const pickupPoints = payload?.pickupPoints ?? [];
  const provinces = payload?.provinces ?? [];
  const unreadNotifCount = notifications.filter((n) => n.unread).length;

  const toggleWishlist = (vehicleId: string) => {
    setWishlistIds((prev) =>
      prev.includes(vehicleId) ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]
    );
  };

  const toggleCompare = (vehicleId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(vehicleId)) return prev.filter((id) => id !== vehicleId);
      if (prev.length >= 3) return [...prev.slice(1), vehicleId];
      return [...prev, vehicleId];
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategory('ALL');
    setTransmission('ALL');
    setMinSeats(0);
    setMaxPrice(2000000);
    setFreeDeliveryOnly(false);
    setGpsOnly(false);
    setSortBy('recommended');
  };

  const handleApplyAiPreset = (preset: 'family' | 'city' | 'vip') => {
    if (preset === 'family') {
      setCategory('MPV');
      setMinSeats(7);
      setMode('DENGAN_SOPIR');
      setPackageType('FULL_BBM_DRIVER');
      setAiTip('Pilihan terbaik keluarga: MPV 7 kursi + Paket Full BBM & Sopir lokal Jogja.');
    } else if (preset === 'city') {
      setCategory('CITY_CAR');
      setTransmission('MATIC');
      setDuration(6);
      setMode('LEPAS_KUNCI');
      setPackageType('UNIT_ONLY');
      setAiTip('Pilihan hemat keliling kota: City Car Matic 6 jam Lepas Kunci.');
    } else {
      setCategory('EXECUTIVE_MPV');
      setMode('DENGAN_SOPIR');
      setPackageType('WITH_DRIVER');
      setAiTip('Pilihan eksekutif Bandara YIA & perjalanan bisnis dengan sopir terverifikasi.');
    }
    setActiveTab('search');
  };

  const autocompleteMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = [
      'Toyota Avanza',
      'Honda Brio',
      'Innova Zenix',
      'Mitsubishi Xpander',
      'Toyota Hiace',
      'Bandara YIA',
      'Stasiun Tugu',
      'Malioboro',
    ];
    if (!q) return base.slice(0, 5);
    return base.filter((b) => b.toLowerCase().includes(q));
  }, [searchQuery]);

  const brands = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of rawItems) {
      const b = brandFromModel(item.vehicle.brandModel);
      map.set(b, (map.get(b) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [rawItems]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F8] text-[#0D0D0D]">
      <Navbar
        activeProvinceSlug={provinceSlug}
        onSelectProvince={(slug) => {
          setProvinceSlug(slug);
          setActiveTab('search');
        }}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'id' ? 'en' : 'id'))}
        activeTab={activeTab}
        onSelectTab={(t) => {
          setActiveTab(t);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        wishlistCount={wishlistIds.length}
        compareCount={compareIds.length}
        notifCount={unreadNotifCount}
        userName={account.name}
        loggedIn={account.loggedIn}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenCompare={() => setCompareModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-7 space-y-6 pb-24 md:pb-10">
        {/* Pilot notice when selecting expansion provinces */}
        {activeProvince && activeProvince.status !== 'ACTIVE' && (
          <div className="rounded-3xl bg-[#0D0D0D] text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF5500] text-white text-[10px] font-extrabold uppercase">
                Ekspansi Multi-Provinsi • Siap Launching
              </span>
              <h2 className="text-lg font-extrabold">
                {activeProvince.name} masuk peta ekspansi Muvo berikutnya
              </h2>
              <p className="text-xs text-white/75 max-w-xl">
                Saat ini armada terverifikasi aktif beroperasi penuh di DI Yogyakarta. Infrastruktur
                hub ({activeProvince.popularCorridors.join(', ')}) sudah siap diaktifkan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProvinceSlug('jogja')}
              className="px-5 py-2.5 rounded-full bg-white text-[#0D0D0D] hover:bg-[#FF5500] hover:text-white text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              Kembali ke Jogja (Aktif)
            </button>
          </div>
        )}

        {/* 1-Line Quick Rental Config Bar (shown on Home & Search) */}
        {(activeTab === 'home' || activeTab === 'search') && (
          <div className="rounded-2xl bg-white border border-black/10 p-2.5 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap">
              {/* Pickup Point */}
              <div className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-[#F7F7F8] border border-black/10 shrink-0 whitespace-nowrap">
                <MapPin className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                <select
                  aria-label="Titik Ambil"
                  value={pickupPointId}
                  onChange={(e) => setPickupPointId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#0D0D0D] focus:outline-none cursor-pointer whitespace-nowrap"
                >
                  {pickupPoints.map((pp) => (
                    <option key={pp.id} value={pp.id}>
                      {pp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <input
                type="date"
                aria-label="Tanggal Mulai"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 px-3 rounded-xl bg-[#F7F7F8] border border-black/10 text-xs font-bold text-[#0D0D0D] shrink-0 whitespace-nowrap focus:outline-none"
              />

              {/* Time */}
              <div className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-[#F7F7F8] border border-black/10 shrink-0 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                <select
                  aria-label="Jam Ambil"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#0D0D0D] focus:outline-none cursor-pointer tabular-nums"
                >
                  {['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'].map((t) => (
                    <option key={t} value={t}>
                      {t} WIB
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration 6/12/24h */}
              <div className="flex items-center gap-1 h-10 p-1 rounded-xl bg-[#F7F7F8] border border-black/10 shrink-0 flex-nowrap">
                {([6, 12, 24] as DurationHours[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`h-8 px-2.5 rounded-lg text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      duration === d
                        ? 'bg-[#0D0D0D] text-white'
                        : 'text-[#0D0D0D]/70 hover:text-[#0D0D0D]'
                    }`}
                  >
                    {d}J
                  </button>
                ))}
              </div>

              {/* Mode */}
              <div className="flex items-center gap-1 h-10 p-1 rounded-xl bg-[#F7F7F8] border border-black/10 shrink-0 flex-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LEPAS_KUNCI');
                    setPackageType('UNIT_ONLY');
                  }}
                  className={`h-8 px-3 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                    mode === 'LEPAS_KUNCI' ? 'bg-[#0D0D0D] text-white' : 'text-[#0D0D0D]/75'
                  }`}
                >
                  Lepas Kunci
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('DENGAN_SOPIR');
                    setPackageType('WITH_DRIVER');
                  }}
                  className={`h-8 px-3 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                    mode === 'DENGAN_SOPIR' && packageType === 'WITH_DRIVER'
                      ? 'bg-[#0D0D0D] text-white'
                      : 'text-[#0D0D0D]/75'
                  }`}
                >
                  + Sopir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('DENGAN_SOPIR');
                    setPackageType('FULL_BBM_DRIVER');
                  }}
                  className={`h-8 px-3 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                    mode === 'DENGAN_SOPIR' && packageType === 'FULL_BBM_DRIVER'
                      ? 'bg-[#FF5500] text-white'
                      : 'text-[#0D0D0D]/75'
                  }`}
                >
                  Full BBM
                </button>
              </div>

              {/* Filter Modal Button */}
              <button
                type="button"
                onClick={() => setFilterModalOpen(true)}
                className="ml-auto h-10 px-3.5 rounded-xl bg-[#0D0D0D] hover:bg-[#FF5500] text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: HOME (Batch 1 Sheets 2 & 3)                                  */}
        {/* ================================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-7">
            {/* Greeting + Search Pill (Batch 1 Sheet 3) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-[#FF5500] uppercase tracking-wider">
                  Halo, {account.loggedIn ? account.name.split(' ')[0] : 'Traveler'} •{' '}
                  {activeProvince?.name || 'DI Yogyakarta'}
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0D0D0D] mt-0.5">
                  {lang === 'en'
                    ? 'Drive Around Jogja Without Surprises'
                    : 'Sewa Mobil di Jogja, Tarif Final & Tanpa Ribet'}
                </h1>
              </div>

              <div className="relative w-full md:w-96">
                <div className="h-12 rounded-full bg-white border border-black/15 px-4 flex items-center gap-2.5 shadow-sm focus-within:border-[#FF5500]">
                  <Search className="w-4 h-4 text-[#FF5500] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setShowSuggestions(false);
                        setActiveTab('search');
                      }
                    }}
                    placeholder="Cari Toyota Avanza, Brio, Stasiun Tugu..."
                    className="w-full bg-transparent text-xs font-semibold text-[#0D0D0D] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-[#6B7280] hover:text-[#0D0D0D] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFilterModalOpen(true)}
                    aria-label="Buka Filter"
                    className="w-8 h-8 rounded-full bg-[#F7F7F8] flex items-center justify-center shrink-0 hover:bg-[#FFF2EB] cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#0D0D0D]" />
                  </button>
                </div>

                {/* Autocomplete Suggestions (Batch 1 Sheet 2) */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 top-14 z-30 rounded-2xl bg-white border border-black/10 shadow-xl p-2 space-y-1">
                    <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold uppercase text-[#6B7280]">
                      <span>Rekomendasi Pencarian</span>
                      <button
                        type="button"
                        onClick={() => setShowSuggestions(false)}
                        className="text-[#FF5500] cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                    {autocompleteMatches.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setSearchQuery(m.includes('YIA') || m.includes('Tugu') || m.includes('Malioboro') ? '' : m);
                          if (m.includes('YIA')) setPickupPointId('pp-diy-yia');
                          if (m.includes('Tugu')) setPickupPointId('pp-diy-tugu');
                          if (m.includes('Malioboro')) setPickupPointId('pp-diy-malioboro');
                          setShowSuggestions(false);
                          setActiveTab('search');
                        }}
                        className="w-full px-3 py-2 rounded-xl hover:bg-[#F7F7F8] flex items-center gap-2 text-xs font-semibold text-[#0D0D0D] text-left cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-[#6B7280]" />
                        <span>{m}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hero Promo Banner Card matching Batch 1 Sheet 3 in White/Black/Bright Orange */}
            <div className="rounded-3xl bg-white border border-black/10 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-sm">
              <div className="lg:col-span-6 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF2EB] text-[#FF5500] text-xs font-extrabold">
                  <Sparkles className="w-3.5 h-3.5" />
                  DI Yogyakarta Aktif • Siap Ekspansi Nasional
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0D0D0D] leading-[1.12]">
                  Keliling Jogja <span className="text-[#FF5500]">Lebih Nyaman</span> Dengan Harga
                  Final
                </h2>
                <p className="text-sm text-[#6B7280] leading-relaxed max-w-lg">
                  Pilih durasi fleksibel 6, 12, atau 24 jam. Gratis antar Bandara YIA & Stasiun Tugu
                  untuk mitra zona inti, dilengkapi kalender anti-double-book dan pre-check OCR.
                </p>
                <div className="flex items-center gap-3 flex-nowrap overflow-x-auto no-scrollbar pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('search')}
                    className="h-12 px-5 rounded-full bg-[#0D0D0D] hover:bg-[#1a1a1a] text-white text-xs font-bold flex items-center gap-3 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Jelajahi Armada ({rawItems.length})</span>
                    <span className="w-7 h-7 rounded-full bg-[#FF5500] text-white flex items-center justify-center">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                  <Link
                    href="/booking/MVO-DIY-2601"
                    className="h-12 px-5 rounded-full border border-black/15 bg-[#F7F7F8] hover:border-[#FF5500] text-[#0D0D0D] text-xs font-bold flex items-center whitespace-nowrap shrink-0"
                  >
                    Cek Sampel E-Voucher
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 relative h-56 sm:h-72 rounded-2xl overflow-hidden bg-[#0D0D0D]">
                <Image
                  src="/images/hero-jogja.jpg"
                  alt="Muvo Car Rental Yogyakarta"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-white/95 backdrop-blur-md p-3 flex items-center justify-between gap-3 border border-black/10">
                  <div>
                    <p className="text-[11px] font-bold text-[#FF5500]">HOT ROUTE JOGJA</p>
                    <p className="text-xs font-extrabold text-[#0D0D0D]">
                      Bandara YIA • Stasiun Tugu • Malioboro
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-[#0D0D0D] text-white text-[11px] font-bold whitespace-nowrap">
                    Mulai Rp 185rb
                  </span>
                </div>
              </div>
            </div>

            {/* Top Categories (Batch 1 Sheet 3) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#0D0D0D]">Kategori Populer</h3>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('ALL');
                    setActiveTab('search');
                  }}
                  className="text-xs font-bold text-[#FF5500] hover:underline cursor-pointer whitespace-nowrap"
                >
                  Lihat Semua →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    id: 'CITY_CAR' as const,
                    title: 'City Car',
                    sub: 'Brio, Agya • Hemat Kota',
                    img: '/images/car-city.jpg',
                  },
                  {
                    id: 'MPV' as const,
                    title: 'MPV Keluarga',
                    sub: 'Avanza, Xpander • 7 Kursi',
                    img: '/images/car-mpv.jpg',
                  },
                  {
                    id: 'EXECUTIVE_MPV' as const,
                    title: 'Executive MPV',
                    sub: 'Innova Zenix • VIP Bisnis',
                    img: '/images/car-executive.jpg',
                  },
                  {
                    id: 'COMMUTER' as const,
                    title: 'Commuter',
                    sub: 'Hiace 14 Kursi • Rombongan',
                    img: '/images/hero-jogja.jpg',
                  },
                ].map((cat) => {
                  const count = rawItems.filter((i) => i.vehicle.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        setActiveTab('search');
                      }}
                      className="rounded-2xl bg-white border border-black/10 hover:border-[#FF5500] p-3 text-left transition-all cursor-pointer group"
                    >
                      <div className="relative h-24 w-full rounded-xl overflow-hidden bg-[#F7F7F8] mb-2.5">
                        <Image
                          src={cat.img}
                          alt={cat.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="text-sm font-extrabold text-[#0D0D0D]">{cat.title}</p>
                      <p className="text-[11px] text-[#6B7280] truncate">{cat.sub}</p>
                      <p className="text-[11px] font-bold text-[#FF5500] mt-1">{count} Unit Siap</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recommended Vehicles Strip (Batch 1 Sheet 3) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#0D0D0D]">
                  Rekomendasi Terbaik Hari Ini
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className="text-xs font-bold text-[#FF5500] hover:underline cursor-pointer whitespace-nowrap"
                >
                  Semua Armada →
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((k) => (
                    <div key={k} className="h-72 rounded-3xl bg-white animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rawItems.slice(0, 3).map((item) => {
                    const isFav = wishlistIds.includes(item.vehicle.id);
                    const isCmp = compareIds.includes(item.vehicle.id);
                    return (
                      <div
                        key={item.vehicle.id}
                        className="rounded-3xl bg-white border border-black/10 hover:border-[#FF5500] overflow-hidden flex flex-col justify-between transition-colors shadow-sm"
                      >
                        <div>
                          <div className="relative h-44 bg-[#F7F7F8]">
                            <Image
                              src={item.vehicle.photo}
                              alt={item.vehicle.brandModel}
                              fill
                              className="object-cover"
                            />
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0D0D0D] text-white text-[10px] font-bold">
                              {categoryLabel(item.vehicle.category, lang)}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleWishlist(item.vehicle.id)}
                              aria-label="Simpan Wishlist"
                              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center shadow cursor-pointer"
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  isFav ? 'fill-[#FF5500] text-[#FF5500]' : 'text-[#0D0D0D]'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-base font-extrabold text-[#0D0D0D]">
                                  {item.vehicle.brandModel}
                                </h4>
                                <p className="text-[11px] text-[#6B7280]">
                                  {item.vehicle.year} • {item.vehicle.transmission} •{' '}
                                  {item.vehicle.seats} Kursi
                                </p>
                              </div>
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0D0D0D] shrink-0">
                                <Star className="w-3.5 h-3.5 fill-[#FF5500] text-[#FF5500]" />
                                {item.partner.rating.toFixed(1)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setPartnerProfile(item.partner)}
                              className="text-[11px] font-semibold text-[#6B7280] hover:text-[#FF5500] flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-[#FF5500]" />
                              {item.partner.businessName} •{' '}
                              {item.routeQuote.isFreeZone ? 'Gratis Antar' : `${item.routeQuote.distanceKm} km`}
                            </button>
                          </div>
                        </div>

                        <div className="px-4 pb-4 pt-2 border-t border-black/5 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-lg font-extrabold text-[#0D0D0D] tabular-nums">
                              {item.price ? formatRp(item.price.rentalTotal) : 'Cek Paket'}
                            </p>
                            <p className="text-[10px] font-semibold text-[#FF5500]">
                              Final {duration} Jam
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleCompare(item.vehicle.id)}
                              className={`h-9 px-2.5 rounded-full border text-xs font-bold cursor-pointer whitespace-nowrap ${
                                isCmp
                                  ? 'border-[#FF5500] bg-[#FFF2EB] text-[#FF5500]'
                                  : 'border-black/15 bg-white text-[#0D0D0D]'
                              }`}
                            >
                              {isCmp ? '✓ VS' : '+ VS'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDetailItem(item)}
                              className="h-9 px-4 rounded-full bg-[#0D0D0D] hover:bg-[#FF5500] text-white text-xs font-bold cursor-pointer whitespace-nowrap transition-colors"
                            >
                              Detail
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Popular Brands, Trending Jogja & Ask Muvo Assistant (Batch 1 Sheet 2) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 rounded-3xl bg-white border border-black/10 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#0D0D0D]">Merek & Rute Populer</h3>
                  <span className="text-[11px] font-bold text-[#FF5500]">Jogja Trending</span>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap">
                  {brands.map(([brand, count]) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => {
                        setSearchQuery(brand);
                        setActiveTab('search');
                      }}
                      className="px-4 py-2 rounded-2xl bg-[#F7F7F8] hover:bg-[#FFF2EB] border border-black/10 text-xs font-bold text-[#0D0D0D] whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <CarFront className="w-3.5 h-3.5 text-[#FF5500]" />
                      <span>{brand}</span>
                      <span className="text-[#6B7280]">({count})</span>
                    </button>
                  ))}
                </div>

                <div className="divide-y divide-black/5">
                  {[
                    {
                      label: 'Sewa Avanza / Xpander Dekat Stasiun Tugu',
                      hub: 'pp-diy-tugu',
                      cat: 'MPV' as const,
                    },
                    {
                      label: 'Ambil Langsung di Bandara YIA Kulon Progo',
                      hub: 'pp-diy-yia',
                      cat: 'ALL' as const,
                    },
                    {
                      label: 'City Car Matic Hemat Area Malioboro & UGM',
                      hub: 'pp-diy-malioboro',
                      cat: 'CITY_CAR' as const,
                    },
                  ].map((tr) => (
                    <button
                      key={tr.label}
                      type="button"
                      onClick={() => {
                        setPickupPointId(tr.hub);
                        setCategory(tr.cat);
                        setActiveTab('search');
                      }}
                      className="w-full py-2.5 flex items-center justify-between text-xs font-semibold text-[#0D0D0D] hover:text-[#FF5500] cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                        <span>{tr.label}</span>
                      </span>
                      <span className="text-[#6B7280]">→</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Asisten Muvo Card matching "Not sure what you're looking for?" (Batch 1 Sheet 2) */}
              <div className="lg:col-span-5 rounded-3xl bg-[#0D0D0D] text-white p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[#FF5500] text-[11px] font-bold">
                    <Bot className="w-3.5 h-3.5" /> Asisten Rekomendasi Muvo
                  </span>
                  <h3 className="text-xl font-extrabold leading-snug">
                    Bingung Pilih Mobil yang Pas untuk Rute Jogjamu?
                  </h3>
                  <p className="text-xs text-white/70">
                    Pilih kebutuhan perjalananmu dan Muvo akan pilihkan paket paling hemat.
                  </p>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap">
                  <button
                    type="button"
                    onClick={() => handleApplyAiPreset('family')}
                    className="px-3.5 py-2 rounded-full bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Wisata Keluarga (7 Kursi)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyAiPreset('city')}
                    className="px-3.5 py-2 rounded-full bg-white text-[#0D0D0D] hover:bg-[#FFF2EB] text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Hemat Dalam Kota
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyAiPreset('vip')}
                    className="px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Jemput VIP Bandara
                  </button>
                </div>
              </div>
            </div>

            {/* Multi-Province Infrastructure Strip */}
            <div className="rounded-3xl bg-white border border-black/10 p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-[#0D0D0D]">
                    Jaringan Multi-Provinsi Muvo
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Fokus utama di DI Yogyakarta, dengan arsitektur siap aktif di provinsi strategis
                    berikutnya.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {provinces.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProvinceSlug(p.slug);
                      setActiveTab('search');
                    }}
                    className={`rounded-2xl p-4 border text-left transition-colors cursor-pointer ${
                      p.slug === provinceSlug
                        ? 'border-[#FF5500] bg-[#FFF2EB]/60'
                        : 'border-black/10 bg-[#F7F7F8] hover:border-[#FF5500]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-[#6B7280]">{p.code}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          p.status === 'ACTIVE'
                            ? 'bg-[#0D0D0D] text-white'
                            : 'bg-white border border-black/15 text-[#6B7280]'
                        }`}
                      >
                        {p.status === 'ACTIVE' ? 'AKTIF' : 'SEGERA V2'}
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-[#0D0D0D]">{p.name}</p>
                    <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                      {p.popularCorridors.join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: SEARCH RESULTS (Batch 1 Sheets 1 & 2)                        */}
        {/* ================================================================= */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            {/* Search input + 1-line category pills */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div className="h-11 flex-1 rounded-full bg-white border border-black/15 px-4 flex items-center gap-2 focus-within:border-[#FF5500]">
                <Search className="w-4 h-4 text-[#FF5500] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter nama mobil, merek, atau mitra..."
                  className="w-full bg-transparent text-xs font-semibold text-[#0D0D0D] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[#6B7280] hover:text-[#0D0D0D] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar">
                <select
                  aria-label="Urutkan"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-10 px-3.5 rounded-full bg-white border border-black/15 text-xs font-bold text-[#0D0D0D] focus:outline-none cursor-pointer whitespace-nowrap"
                >
                  <option value="recommended">Urut: Paling Sesuai</option>
                  <option value="price_asc">Harga Terendah</option>
                  <option value="price_desc">Harga Tertinggi</option>
                  <option value="rating_desc">Rating Tertinggi</option>
                  <option value="nearest">Terdekat OSRM</option>
                </select>

                <button
                  type="button"
                  onClick={() => setFilterModalOpen(true)}
                  className="h-10 px-4 rounded-full bg-[#0D0D0D] text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Filter Lanjutan</span>
                </button>
              </div>
            </div>

            {aiTip && (
              <div className="rounded-2xl bg-[#FFF2EB] border border-[#FF5500]/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-semibold text-[#0D0D0D]">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF5500] shrink-0" />
                  {aiTip}
                </span>
                <button
                  type="button"
                  onClick={() => setAiTip(null)}
                  className="text-[#FF5500] font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* 1-Line Category & Active Filter Chips (Batch 1 Sheet 1) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-1">
              {[
                { id: 'ALL' as const, label: 'Semua' },
                { id: 'CITY_CAR' as const, label: 'City Car' },
                { id: 'MPV' as const, label: 'MPV Keluarga' },
                { id: 'EXECUTIVE_MPV' as const, label: 'Executive MPV' },
                { id: 'COMMUTER' as const, label: 'Commuter' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                    category === cat.id
                      ? 'bg-[#0D0D0D] text-white'
                      : 'bg-white border border-black/10 text-[#0D0D0D] hover:border-[#FF5500]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
              {transmission !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setTransmission('ALL')}
                  className="px-3 py-1.5 rounded-full bg-[#FFF2EB] border border-[#FF5500]/30 text-[#FF5500] text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {transmission} ×
                </button>
              )}
              {freeDeliveryOnly && (
                <button
                  type="button"
                  onClick={() => setFreeDeliveryOnly(false)}
                  className="px-3 py-1.5 rounded-full bg-[#FFF2EB] border border-[#FF5500]/30 text-[#FF5500] text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Gratis Antar ×
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span className="font-bold text-[#0D0D0D]">
                {filteredItems.length} Mobil Ditemukan
              </span>
              {compareIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCompareModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5500] text-white font-bold cursor-pointer"
                >
                  <GitCompareArrows className="w-3.5 h-3.5" />
                  Bandingkan ({compareIds.length}/3)
                </button>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="rounded-3xl bg-white border border-black/10 p-10 text-center space-y-3">
                <p className="text-base font-extrabold text-[#0D0D0D]">
                  Tidak ada mobil yang cocok dengan filter ini
                </p>
                <p className="text-xs text-[#6B7280]">
                  Coba reset beberapa filter atau ubah durasi sewa menjadi 12 / 24 jam.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-full bg-[#0D0D0D] text-white text-xs font-bold cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item) => {
                  const isFav = wishlistIds.includes(item.vehicle.id);
                  const isCmp = compareIds.includes(item.vehicle.id);
                  const bookable = item.rateAvailable && item.calendarAvailable;

                  return (
                    <article
                      key={item.vehicle.id}
                      className="rounded-3xl bg-white border border-black/10 hover:border-[#FF5500] p-4 flex flex-col justify-between gap-4 transition-colors shadow-sm"
                    >
                      <div className="flex gap-4">
                        <div className="relative w-36 sm:w-44 h-28 rounded-2xl overflow-hidden bg-[#F7F7F8] shrink-0">
                          <Image
                            src={item.vehicle.photo}
                            alt={item.vehicle.brandModel}
                            fill
                            className="object-cover"
                          />
                          <span
                            className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              bookable
                                ? 'bg-[#0D0D0D] text-white'
                                : 'bg-red-600 text-white'
                            }`}
                          >
                            {bookable ? 'TERSEDIA' : 'PENUH'}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-base font-extrabold text-[#0D0D0D] truncate">
                                {item.vehicle.brandModel}
                              </h3>
                              <button
                                type="button"
                                onClick={() => toggleWishlist(item.vehicle.id)}
                                aria-label="Simpan Wishlist"
                                className="cursor-pointer shrink-0"
                              >
                                <Heart
                                  className={`w-4 h-4 ${
                                    isFav ? 'fill-[#FF5500] text-[#FF5500]' : 'text-[#0D0D0D]/50'
                                  }`}
                                />
                              </button>
                            </div>
                            <p className="text-[11px] text-[#6B7280] mt-0.5">
                              {item.vehicle.year} • {item.vehicle.transmission} •{' '}
                              {item.vehicle.seats} Kursi • {item.vehicle.fuelType}
                            </p>
                            <button
                              type="button"
                              onClick={() => setPartnerProfile(item.partner)}
                              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0D0D0D] hover:text-[#FF5500] cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5 fill-[#FF5500] text-[#FF5500]" />
                              <span>{item.partner.rating.toFixed(1)}</span>
                              <span className="text-[#6B7280] truncate">
                                • {item.partner.businessName}
                              </span>
                            </button>
                          </div>

                          <div className="flex items-baseline justify-between gap-2 pt-2">
                            <div>
                              <span className="text-lg font-extrabold text-[#0D0D0D] tabular-nums">
                                {item.price ? formatRp(item.price.rentalTotal) : 'Cek Opsi'}
                              </span>
                              <span className="text-[10px] text-[#6B7280] ml-1">
                                / {duration}J
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-[#FF5500] whitespace-nowrap">
                              {item.routeQuote.isFreeZone
                                ? 'Gratis Antar'
                                : `+Ongkir ${formatRp(item.routeQuote.deliveryFee)}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!bookable && item.conflictReason && (
                        <p className="rounded-xl bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                          {item.conflictReason}
                        </p>
                      )}

                      <div className="pt-2.5 border-t border-black/5 flex items-center justify-between gap-2 flex-nowrap">
                        <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                          {item.vehicle.hasGpsTracker && (
                            <span className="inline-flex items-center gap-1 font-semibold text-[#0D0D0D]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5500]" />
                              GPS Ready
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleCompare(item.vehicle.id)}
                            className={`h-9 px-3 rounded-full border text-xs font-bold whitespace-nowrap cursor-pointer ${
                              isCmp
                                ? 'border-[#FF5500] bg-[#FFF2EB] text-[#FF5500]'
                                : 'border-black/15 bg-white text-[#0D0D0D]'
                            }`}
                          >
                            {isCmp ? '✓ Bandingkan' : '+ Bandingkan'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailItem(item)}
                            className="h-9 px-3.5 rounded-full border border-black/15 bg-[#F7F7F8] hover:border-[#FF5500] text-xs font-bold text-[#0D0D0D] whitespace-nowrap cursor-pointer"
                          >
                            Detail
                          </button>
                          <button
                            type="button"
                            disabled={!bookable}
                            onClick={() => setBookingItem(item)}
                            className="h-9 px-4 rounded-full bg-[#0D0D0D] hover:bg-[#FF5500] disabled:opacity-40 text-white text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
                          >
                            Sewa
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: WISHLIST, BOOKINGS & PROFILE                                 */}
        {/* ================================================================= */}
        {activeTab === 'wishlist' && (
          <WishlistHubView
            wishlistedItems={wishlistedItems}
            savedSearches={savedSearches}
            onToggleWishlist={toggleWishlist}
            onSelectVehicle={(item) => setDetailItem(item)}
            onApplySavedSearch={(s) => {
              setProvinceSlug(s.provinceSlug);
              setMode(s.mode);
              setDuration(s.duration);
              setPackageType(s.mode === 'LEPAS_KUNCI' ? 'UNIT_ONLY' : 'WITH_DRIVER');
              setCategory(s.category as VehicleCategory);
              setActiveTab('search');
            }}
            onToggleSavedSearch={(id) =>
              setSavedSearches((prev) =>
                prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
              )
            }
          />
        )}

        {activeTab === 'bookings' && (
          <BookingsGarageHubView sessionBookings={sessionBookings} />
        )}

        {activeTab === 'profile' && (
          <ProfileHubView
            account={account}
            wishlistCount={wishlistIds.length}
            bookingCount={sessionBookings.length + 2}
            notifications={notifications}
            messages={INITIAL_MESSAGES}
            onMarkNotifsRead={() =>
              setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
            }
            onOpenAuth={() => setAuthModalOpen(true)}
            onLogout={() =>
              setAccount((prev) => ({
                ...prev,
                loggedIn: false,
              }))
            }
            onJumpToPromoSearch={() => {
              setFreeDeliveryOnly(true);
              setActiveTab('search');
            }}
          />
        )}
      </main>

      <Footer />

      {/* Modals */}
      <UserAuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        account={account}
        onAuthSuccess={(next) => setAccount(next)}
        lang={lang}
      />

      <FilterSheetModal
        open={filterModalOpen}
        onClose={() => {
          setFilterModalOpen(false);
          setActiveTab('search');
        }}
        sortBy={sortBy}
        onChangeSort={setSortBy}
        duration={duration}
        onChangeDuration={setDuration}
        mode={mode}
        onChangeMode={setMode}
        packageType={packageType}
        onChangePackage={setPackageType}
        pickupPointId={pickupPointId}
        onChangePickup={setPickupPointId}
        pickupPoints={pickupPoints}
        category={category}
        onChangeCategory={setCategory}
        transmission={transmission}
        onChangeTransmission={setTransmission}
        minSeats={minSeats}
        onChangeMinSeats={setMinSeats}
        maxPrice={maxPrice}
        onChangeMaxPrice={setMaxPrice}
        freeDeliveryOnly={freeDeliveryOnly}
        onChangeFreeDelivery={setFreeDeliveryOnly}
        gpsOnly={gpsOnly}
        onChangeGpsOnly={setGpsOnly}
        onReset={handleResetFilters}
        resultCount={filteredItems.length}
      />

      <CompareDrawerModal
        open={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        items={compareItems}
        onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
        onSelectForBooking={(item) => setBookingItem(item)}
        lang={lang}
      />

      <PartnerProfileModal
        partner={partnerProfile}
        partnerVehicles={
          partnerProfile
            ? rawItems.filter((i) => i.partner.id === partnerProfile.id)
            : []
        }
        onClose={() => setPartnerProfile(null)}
        onSelectVehicle={(item) => setDetailItem(item)}
      />

      <VehicleDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        duration={duration}
        mode={mode}
        packageType={packageType}
        isWishlisted={detailItem ? wishlistIds.includes(detailItem.vehicle.id) : false}
        onToggleWishlist={toggleWishlist}
        isCompared={detailItem ? compareIds.includes(detailItem.vehicle.id) : false}
        onToggleCompare={toggleCompare}
        onOpenPartner={(p) => {
          setDetailItem(null);
          setPartnerProfile(p);
        }}
        onProceedToBooking={(item) => {
          setDetailItem(null);
          setBookingItem(item);
        }}
        lang={lang}
      />

      <BookingFlowModal
        item={bookingItem}
        onClose={() => setBookingItem(null)}
        provinceId={activeProvince?.id || 'prov-diy'}
        pickupPointId={pickupPointId}
        initialStartDate={startDate}
        initialStartTime={startTime}
        duration={duration}
        mode={mode}
        packageType={packageType}
        account={account}
        onBookingCreated={(bkg) => {
          setSessionBookings((prev) => [bkg, ...prev]);
        }}
      />
    </div>
  );
}
