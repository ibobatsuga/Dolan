'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Bell,
  Calendar,
  CarFront,
  CheckCircle2,
  ChevronRight,
  Heart,
  LogOut,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingDown,
  User as UserIcon,
} from 'lucide-react';
import { Booking } from '@/lib/types';
import {
  BookingListPayload,
  formatRp,
  MarketplaceSearchItem,
  PartnerMessageThread,
  SavedSearchItem,
  UserAccount,
  UserNotificationItem,
} from './types';

/* -------------------------------------------------------------------------- */
/* 1. WISHLIST, SAVED SEARCHES & PRICE ALERTS (Batch 2 Sheet 4)               */
/* -------------------------------------------------------------------------- */
export function WishlistHubView({
  wishlistedItems,
  savedSearches,
  onToggleWishlist,
  onSelectVehicle,
  onApplySavedSearch,
  onToggleSavedSearch,
}: {
  wishlistedItems: MarketplaceSearchItem[];
  savedSearches: SavedSearchItem[];
  onToggleWishlist: (vehicleId: string) => void;
  onSelectVehicle: (item: MarketplaceSearchItem) => void;
  onApplySavedSearch: (s: SavedSearchItem) => void;
  onToggleSavedSearch: (id: string) => void;
}) {
  const [subTab, setSubTab] = useState<'all' | 'available' | 'saved' | 'alerts'>('all');

  const shownVehicles =
    subTab === 'available'
      ? wishlistedItems.filter((i) => i.calendarAvailable && i.rateAvailable)
      : wishlistedItems;

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0D0D0D]">Wishlist & Pantauan Tarif</h2>
          <p className="text-xs text-[#6B7280]">
            Simpan unit incaran, rute favorit Jogja, dan pantau penurunan tarif harian.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap">
          {[
            { id: 'all' as const, label: `Semua (${wishlistedItems.length})` },
            {
              id: 'available' as const,
              label: `Tersedia (${wishlistedItems.filter((i) => i.calendarAvailable).length})`,
            },
            { id: 'saved' as const, label: `Rute Tersimpan (${savedSearches.length})` },
            { id: 'alerts' as const, label: 'Info Turun Harga' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === t.id
                  ? 'bg-[#0D0D0D] text-white'
                  : 'bg-white text-[#0D0D0D] border border-black/10 hover:border-[#FF5500]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {(subTab === 'all' || subTab === 'available') && (
        <>
          {shownVehicles.length === 0 ? (
            <div className="rounded-3xl bg-white border border-black/10 p-10 text-center space-y-2">
              <Heart className="w-8 h-8 text-[#FF5500] mx-auto" />
              <p className="text-sm font-extrabold text-[#0D0D0D]">Wishlist masih kosong</p>
              <p className="text-xs text-[#6B7280]">
                Ketuk ikon hati pada kartu mobil untuk menyimpannya di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shownVehicles.map((item) => (
                <div
                  key={item.vehicle.id}
                  className="rounded-3xl bg-white border border-black/10 p-4 flex flex-col justify-between gap-3 hover:border-[#FF5500] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-24 h-20 rounded-2xl overflow-hidden bg-[#F7F7F8] shrink-0">
                      <Image
                        src={item.vehicle.photo}
                        alt={item.vehicle.brandModel}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-extrabold text-[#0D0D0D] truncate">
                          {item.vehicle.brandModel}
                        </p>
                        <button
                          type="button"
                          onClick={() => onToggleWishlist(item.vehicle.id)}
                          aria-label="Hapus dari Wishlist"
                          className="cursor-pointer shrink-0"
                        >
                          <Heart className="w-4 h-4 fill-[#FF5500] text-[#FF5500]" />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#6B7280]">
                        {item.vehicle.transmission} • {item.vehicle.seats} Kursi • {item.hubName}
                      </p>
                      <p className="text-base font-extrabold text-[#0D0D0D] mt-1 tabular-nums">
                        {item.price ? formatRp(item.price.rentalTotal) : 'Cek Jadwal'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-black/5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        item.calendarAvailable
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {item.calendarAvailable ? 'Siap Disewa' : 'Jadwal Penuh'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectVehicle(item)}
                      className="px-4 py-1.5 rounded-full bg-[#0D0D0D] hover:bg-[#FF5500] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      Lihat Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {subTab === 'saved' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {savedSearches.map((s) => (
            <div
              key={s.id}
              className="rounded-3xl bg-white border border-black/10 p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#FFF2EB] text-[#FF5500] flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-[#0D0D0D] truncate">{s.title}</p>
                  <p className="text-[11px] text-[#6B7280] truncate">{s.summary}</p>
                  <p className="text-[11px] font-bold text-[#FF5500] mt-0.5">
                    {s.newMatches} Unit Cocok
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleSavedSearch(s.id)}
                  aria-label="Toggle Alert"
                  className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer ${
                    s.active
                      ? 'bg-[#0D0D0D] text-white border-[#0D0D0D]'
                      : 'bg-[#F7F7F8] text-[#6B7280] border-black/10'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onApplySavedSearch(s)}
                  className="px-3.5 py-2 rounded-full bg-[#FF5500] hover:bg-[#E64D00] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                >
                  Cari
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'alerts' && (
        <div className="space-y-3">
          {[
            {
              car: 'Toyota Avanza Veloz 2024 (Lepas Kunci 12 Jam)',
              now: 'Rp 325.000',
              was: 'Rp 360.000',
              drop: 'Hemat Rp 35.000',
              loc: 'Stasiun Tugu • Gratis Antar',
            },
            {
              car: 'Honda Brio RS Matic (6 Jam Ekspres)',
              now: 'Rp 185.000',
              was: 'Rp 210.000',
              drop: 'Hemat Rp 25.000',
              loc: 'Malioboro • Unit Terverifikasi',
            },
          ].map((a) => (
            <div
              key={a.car}
              className="rounded-3xl bg-white border border-black/10 p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF2EB] text-[#FF5500] flex items-center justify-center shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[#0D0D0D]">{a.car}</p>
                  <p className="text-xs text-[#6B7280]">{a.loc}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="font-extrabold text-[#0D0D0D]">{a.now}</span>
                    <span className="line-through text-[#6B7280]">{a.was}</span>
                    <span className="font-bold text-[#FF5500]">{a.drop}</span>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-[#0D0D0D] text-white text-[11px] font-bold whitespace-nowrap shrink-0">
                Promo Aktif
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. MY BOOKINGS & TRIP GARAGE (Batch 3 Sheet 5)                             */
/* -------------------------------------------------------------------------- */
export function BookingsGarageHubView({
  sessionBookings,
}: {
  sessionBookings: Booking[];
}) {
  const [subTab, setSubTab] = useState<'trips' | 'checklist' | 'insurance'>('trips');
  const [serverData, setServerData] = useState<BookingListPayload | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/bookings')
      .then((res) => (res.ok ? res.json() : null))
      .then((json: BookingListPayload | null) => {
        if (active && json) setServerData(json);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const allBookings = (() => {
    const map = new Map<string, Booking>();
    for (const b of sessionBookings) map.set(b.code, b);
    for (const b of serverData?.bookings ?? []) {
      if (!map.has(b.code)) map.set(b.code, b);
    }
    return Array.from(map.values());
  })();

  const findVehicle = (id: string) => serverData?.vehicles.find((v) => v.id === id);
  const findPartner = (id: string) => serverData?.partners.find((p) => p.id === id);

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0D0D0D]">Booking & Garasi Perjalanan</h2>
          <p className="text-xs text-[#6B7280]">
            Pantau jadwal ambil, e-voucher, checklist kondisi unit, dan proteksi asuransi Muvo.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap">
          {[
            { id: 'trips' as const, label: `Perjalanan (${allBookings.length})` },
            { id: 'checklist' as const, label: 'Checklist Serah-Terima' },
            { id: 'insurance' as const, label: 'Asuransi & Escrow' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === t.id
                  ? 'bg-[#0D0D0D] text-white'
                  : 'bg-white text-[#0D0D0D] border border-black/10 hover:border-[#FF5500]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'trips' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allBookings.map((b) => {
            const v = findVehicle(b.vehicleId);
            const p = findPartner(b.partnerId);
            return (
              <div
                key={b.code}
                className="rounded-3xl bg-white border border-black/10 p-5 space-y-4 hover:border-[#FF5500] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-20 h-16 rounded-2xl overflow-hidden bg-[#F7F7F8] shrink-0">
                      <Image
                        src={v?.photo || '/images/car-mpv.jpg'}
                        alt={v?.brandModel || b.code}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-mono font-bold text-[#FF5500]">
                        {b.code}
                      </span>
                      <h3 className="text-base font-extrabold text-[#0D0D0D] truncate">
                        {v?.brandModel || 'Armada Terverifikasi'}
                      </h3>
                      <p className="text-xs text-[#6B7280] truncate">
                        {p?.businessName || 'Mitra Jogja'} • {v?.plateMasked || 'AB ****'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#0D0D0D] text-white text-[10px] font-bold whitespace-nowrap shrink-0">
                    {b.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#F7F7F8] p-3 text-xs">
                  <div>
                    <p className="text-[10px] text-[#6B7280]">Durasi</p>
                    <p className="font-bold text-[#0D0D0D]">{b.durationHours} Jam</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280]">Ambil</p>
                    <p className="font-bold text-[#0D0D0D] truncate">{b.pickupLocationName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280]">Total Sewa</p>
                    <p className="font-extrabold text-[#FF5500] tabular-nums">
                      {formatRp(b.priceSnapshot.rentalTotal)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#FF5500]" />
                    {new Date(b.startAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  <Link
                    href={`/booking/${b.code}`}
                    className="px-4 py-2 rounded-full bg-[#0D0D0D] hover:bg-[#FF5500] text-white text-xs font-bold whitespace-nowrap transition-colors"
                  >
                    Buka E-Voucher →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'checklist' && (
        <div className="rounded-3xl bg-white border border-black/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#0D0D0D]">
                Timeline Kondisi & Serah-Terima Digital
              </h3>
              <p className="text-xs text-[#6B7280]">
                Setiap unit dicek 4 sisi bodi, indikator BBM, dan odometer dengan watermark waktu.
              </p>
            </div>
            <Link
              href={`/booking/${allBookings[0]?.code || 'MVO-DIY-2601'}`}
              className="px-4 py-2 rounded-full bg-[#FF5500] text-white text-xs font-bold whitespace-nowrap shrink-0"
            >
              Isi Checklist Sekarang
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                title: '1. Inspeksi Pra-Serah Terima Mitra',
                status: 'Selesai',
                detail: 'Tekanan ban, AC kabin, kebersihan, dan level BBM ≥ 75% tervalidasi.',
              },
              {
                title: '2. Konfirmasi Pickup Penyewa (Watermark Foto)',
                status: 'Siap Dikonfirmasi',
                detail: 'Cocokkan odometer & foto goresan awal di E-Voucher sebelum jalan.',
              },
              {
                title: '3. Pengembalian & Rilis Deposit Escrow Otomatis',
                status: 'Menunggu Return',
                detail: 'Deposit lepas kunci dilepas penuh begitu kedua pihak kunci checklist RETURN.',
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-2xl bg-[#F7F7F8] border border-black/5 p-3.5 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#FF5500] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-[#0D0D0D]">{step.title}</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">{step.detail}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white border border-black/10 text-[10px] font-bold text-[#0D0D0D] whitespace-nowrap">
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'insurance' && (
        <div className="rounded-3xl bg-white border border-black/10 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF2EB] text-[#FF5500] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0D0D0D]">
                  Proteksi Perjalanan Muvo Shield
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Aktif otomatis selama masa sewa + Escrow Deposit transparan.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
              Aktif
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            {[
              { label: 'Bantuan Darurat 24/7', desc: 'Towing area DIY & Jateng' },
              { label: 'Unit Pengganti Cepat', desc: 'Jika kendala teknis mendadak' },
              { label: 'Escrow Terlindungi', desc: 'Deposit aman sampai selesai' },
              { label: 'Mediasi Adil', desc: 'Berdasarkan foto checklist' },
            ].map((cov) => (
              <div
                key={cov.label}
                className="rounded-2xl bg-[#F7F7F8] border border-black/5 p-3 space-y-1"
              >
                <CarFront className="w-4 h-4 text-[#FF5500] mx-auto" />
                <p className="text-xs font-extrabold text-[#0D0D0D]">{cov.label}</p>
                <p className="text-[10px] text-[#6B7280]">{cov.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. PROFILE, NOTIFICATIONS, MESSAGES & PROMOS (Batch 3 Sheets 3 & 4)        */
/* -------------------------------------------------------------------------- */
export function ProfileHubView({
  account,
  wishlistCount,
  bookingCount,
  notifications,
  messages,
  onMarkNotifsRead,
  onOpenAuth,
  onLogout,
  onJumpToPromoSearch,
}: {
  account: UserAccount;
  wishlistCount: number;
  bookingCount: number;
  notifications: UserNotificationItem[];
  messages: PartnerMessageThread[];
  onMarkNotifsRead: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onJumpToPromoSearch: () => void;
}) {
  const [subTab, setSubTab] = useState<'overview' | 'notifications' | 'messages' | 'promos' | 'settings'>(
    'overview'
  );
  const [notifPrice, setNotifPrice] = useState(true);
  const [notifReminder, setNotifReminder] = useState(true);
  const [notifPromo, setNotifPromo] = useState(true);

  return (
    <section className="space-y-5">
      {/* Top Tabs matching Batch 3 Sheets 3-4 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap">
        {[
          { id: 'overview' as const, label: 'Profil Saya' },
          {
            id: 'notifications' as const,
            label: `Notifikasi (${notifications.filter((n) => n.unread).length})`,
          },
          { id: 'messages' as const, label: `Pesan Mitra (${messages.length})` },
          { id: 'promos' as const, label: 'Promo Jogja' },
          { id: 'settings' as const, label: 'Preferensi & Privasi' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === t.id
                ? 'bg-[#0D0D0D] text-white'
                : 'bg-white text-[#0D0D0D] border border-black/10 hover:border-[#FF5500]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Card: Avatar + Stats + Premium Dark Banner */}
          <div className="rounded-3xl bg-white border border-black/10 p-5 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[#0D0D0D] text-white font-extrabold text-lg flex items-center justify-center shrink-0">
                {account.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-extrabold text-[#0D0D0D] truncate">
                    {account.name}
                  </h3>
                  <CheckCircle2 className="w-4 h-4 text-[#FF5500] shrink-0" />
                </div>
                <p className="text-xs text-[#6B7280] truncate">{account.email}</p>
                <p className="text-xs font-semibold text-[#0D0D0D]">{account.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#F7F7F8] p-3 text-center">
              <div>
                <p className="text-lg font-extrabold text-[#0D0D0D] tabular-nums">
                  {wishlistCount}
                </p>
                <p className="text-[11px] text-[#6B7280]">Wishlist</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-[#0D0D0D] tabular-nums">
                  {bookingCount}
                </p>
                <p className="text-[11px] text-[#6B7280]">Booking</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-[#FF5500] tabular-nums">OK</p>
                <p className="text-[11px] text-[#6B7280]">KTP/SIM</p>
              </div>
            </div>

            {/* Dark Member Card (Batch 3 Sheet 3) */}
            <div className="rounded-2xl bg-[#0D0D0D] text-white p-4 space-y-2.5 relative overflow-hidden">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF5500]">
                <Sparkles className="w-3.5 h-3.5" />
                {account.memberTier}
              </span>
              <p className="text-sm font-extrabold leading-snug">
                Nikmati bebas ongkir antar zona Bandara YIA & Stasiun Tugu.
              </p>
              <button
                type="button"
                onClick={() => setSubTab('promos')}
                className="px-3.5 py-1.5 rounded-full bg-white text-[#0D0D0D] hover:bg-[#FF5500] hover:text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Lihat Benefit Promo
              </button>
            </div>

            {account.loggedIn ? (
              <button
                type="button"
                onClick={onLogout}
                className="w-full h-11 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Keluar Akun
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full h-11 rounded-full bg-[#0D0D0D] hover:bg-[#FF5500] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                Masuk / Daftar Akun Muvo
              </button>
            )}
          </div>

          {/* Quick Access Menu matching Batch 3 Sheet 3 */}
          <div className="lg:col-span-2 rounded-3xl bg-white border border-black/10 p-5 space-y-2">
            <h3 className="text-sm font-extrabold text-[#0D0D0D] mb-3">Akses Cepat Penyewa</h3>
            {[
              {
                icon: Bell,
                title: 'Notifikasi & Pengingat Jadwal',
                sub: 'Alert penurunan tarif & status konfirmasi mitra',
                badge: notifications.filter((n) => n.unread).length,
                action: () => setSubTab('notifications'),
              },
              {
                icon: MessageSquare,
                title: 'Pesan Mitra & Dukungan Muvo',
                sub: 'Chat koordinasi antar-jemput Bandara YIA / Stasiun Tugu',
                badge: messages.reduce((acc, m) => acc + m.unreadCount, 0),
                action: () => setSubTab('messages'),
              },
              {
                icon: Tag,
                title: 'Offers & Promo Spesial Jogja',
                sub: 'Diskon paket 12 jam, 24 jam, dan Full BBM + Sopir',
                action: () => setSubTab('promos'),
              },
              {
                icon: ShieldCheck,
                title: 'Pengaturan Akun & Verifikasi Dokumen',
                sub: 'Preferensi notifikasi, bahasa, radius pencarian & privasi GPS',
                action: () => setSubTab('settings'),
              },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <button
                  key={row.title}
                  type="button"
                  onClick={row.action}
                  className="w-full rounded-2xl bg-[#F7F7F8] hover:bg-[#FFF2EB] p-4 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-black/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#FF5500]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#0D0D0D] truncate">{row.title}</p>
                      <p className="text-xs text-[#6B7280] truncate">{row.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {row.badge ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#FF5500] text-white text-[10px] font-bold tabular-nums">
                        {row.badge}
                      </span>
                    ) : null}
                    <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'notifications' && (
        <div className="rounded-3xl bg-white border border-black/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#0D0D0D]">Pusat Notifikasi</h3>
            <button
              type="button"
              onClick={onMarkNotifsRead}
              className="text-xs font-bold text-[#FF5500] hover:underline cursor-pointer"
            >
              Tandai Semua Dibaca
            </button>
          </div>
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl p-3.5 border flex items-start justify-between gap-3 ${
                n.unread ? 'bg-[#FFF2EB]/60 border-[#FF5500]/25' : 'bg-[#F7F7F8] border-black/5'
              }`}
            >
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-[#0D0D0D]">{n.title}</p>
                <p className="text-xs text-[#6B7280]">{n.body}</p>
                <p className="text-[10px] text-[#6B7280]">{n.time}</p>
              </div>
              {n.unread && <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] mt-1 shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {subTab === 'messages' && (
        <div className="rounded-3xl bg-white border border-black/10 p-5 space-y-3">
          <h3 className="text-base font-extrabold text-[#0D0D0D]">Pesan Mitra & Support</h3>
          {messages.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl bg-[#F7F7F8] border border-black/5 p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#0D0D0D] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                  {m.sender.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#0D0D0D] flex items-center gap-1">
                    {m.sender}
                    {m.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5500]" />}
                  </p>
                  <p className="text-[11px] text-[#6B7280] truncate">{m.lastMessage}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-[#6B7280]">{m.time}</p>
                {m.unreadCount > 0 && (
                  <span className="inline-flex mt-1 px-1.5 py-0.5 rounded-full bg-[#FF5500] text-white text-[10px] font-bold">
                    {m.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'promos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              badge: 'TERBATAS',
              title: 'Gratis Antar Bandara YIA & Tugu',
              desc: 'Berlaku untuk paket 12 Jam & 24 Jam mitra zona inti Sleman–Kota Jogja.',
            },
            {
              badge: 'PAKET WISATA',
              title: 'Full BBM + Sopir Mulai Rp 495rb',
              desc: 'Keliling Malioboro – Prambanan – Parangtritis tanpa pusing hitung bensin.',
            },
          ].map((p) => (
            <div
              key={p.title}
              className="rounded-3xl bg-white border border-black/10 p-5 flex items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FFF2EB] text-[#FF5500] text-[10px] font-extrabold">
                  {p.badge}
                </span>
                <h4 className="text-base font-extrabold text-[#0D0D0D]">{p.title}</h4>
                <p className="text-xs text-[#6B7280]">{p.desc}</p>
              </div>
              <button
                type="button"
                onClick={onJumpToPromoSearch}
                className="px-4 py-2 rounded-full bg-[#0D0D0D] hover:bg-[#FF5500] text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Pakai Promo
              </button>
            </div>
          ))}
        </div>
      )}

      {subTab === 'settings' && (
        <div className="rounded-3xl bg-white border border-black/10 p-5 space-y-3 max-w-xl">
          <h3 className="text-base font-extrabold text-[#0D0D0D]">Preferensi & Notifikasi</h3>
          {[
            {
              label: 'Notifikasi Penurunan Tarif',
              val: notifPrice,
              set: () => setNotifPrice((v) => !v),
            },
            {
              label: 'Pengingat Jadwal Ambil & Kembali',
              val: notifReminder,
              set: () => setNotifReminder((v) => !v),
            },
            {
              label: 'Info Promo Eksklusif Muvo',
              val: notifPromo,
              set: () => setNotifPromo((v) => !v),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl bg-[#F7F7F8] px-4 py-3"
            >
              <span className="text-xs font-bold text-[#0D0D0D]">{item.label}</span>
              <input
                type="checkbox"
                checked={item.val}
                onChange={item.set}
                className="w-4 h-4 accent-[#FF5500] cursor-pointer"
              />
            </div>
          ))}
          <div className="rounded-2xl bg-[#FFF2EB] border border-[#FF5500]/25 p-3 text-xs text-[#0D0D0D] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FF5500] shrink-0" />
            Wilayah pencarian default: <strong>DI Yogyakarta (Siap Ekspansi Multi-Provinsi)</strong>
          </div>
        </div>
      )}
    </section>
  );
}
