'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  Calculator,
  CarFront,
  Fuel,
  Gauge,
  GitCompareArrows,
  Heart,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react';
import { DurationHours, PackageType, PartnerProfile, RentalMode } from '@/lib/types';
import { categoryLabel, formatRp, MarketplaceSearchItem } from './types';

interface VehicleDetailModalProps {
  item: MarketplaceSearchItem | null;
  onClose: () => void;
  duration: DurationHours;
  mode: RentalMode;
  packageType: PackageType;
  isWishlisted: boolean;
  onToggleWishlist: (vehicleId: string) => void;
  isCompared: boolean;
  onToggleCompare: (vehicleId: string) => void;
  onOpenPartner: (partner: PartnerProfile) => void;
  onProceedToBooking: (item: MarketplaceSearchItem) => void;
  lang: 'id' | 'en';
}

export function VehicleDetailModal({
  item,
  onClose,
  duration,
  mode,
  packageType,
  isWishlisted,
  onToggleWishlist,
  isCompared,
  onToggleCompare,
  onOpenPartner,
  onProceedToBooking,
  lang,
}: VehicleDetailModalProps) {
  const [tab, setTab] = useState<'overview' | 'specs' | 'gallery'>('overview');
  const [photoIdx, setPhotoIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [simDuration, setSimDuration] = useState<DurationHours>(duration);

  if (!item) return null;

  const { vehicle, partner, routeQuote, price } = item;

  const galleryPhotos = [
    { src: vehicle.photo, label: 'Eksterior Depan' },
    { src: '/images/hero-jogja.jpg', label: 'Siap Rute Jogja' },
    { src: '/images/car-executive.jpg', label: 'Sudut Kabin & Samping' },
    { src: '/images/car-city.jpg', label: 'Detail Velg & Lampu' },
  ];

  const colors = [
    { name: 'Obsidian Black', hex: '#141414' },
    { name: 'Pearl White', hex: '#F3F4F6' },
    { name: 'Metallic Silver', hex: '#9CA3AF' },
    { name: 'Muvo Orange Edition', hex: '#FF5500' },
  ];

  const pkgKey: PackageType =
    mode === 'LEPAS_KUNCI' ? 'UNIT_ONLY' : packageType === 'UNIT_ONLY' ? 'WITH_DRIVER' : packageType;
  const simBaseRate =
    vehicle.ratePlan.rates[simDuration]?.[pkgKey] ??
    vehicle.ratePlan.rates[simDuration]?.UNIT_ONLY ??
    vehicle.ratePlan.rates[12]?.WITH_DRIVER ??
    price?.baseRentalFee ??
    0;
  const simRentalTotal = simBaseRate + routeQuote.deliveryFee;
  const simDp = Math.round(simRentalTotal * 0.3);

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden border border-black/10 shadow-2xl">
        {/* Top Bar */}
        <div className="px-5 py-3.5 border-b border-black/10 flex items-center justify-between gap-2">
          <span className="text-sm font-extrabold text-[#0D0D0D] whitespace-nowrap">
            Detail Unit & Tarif Final
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleCompare(vehicle.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 border cursor-pointer whitespace-nowrap ${
                isCompared
                  ? 'bg-[#FFF2EB] border-[#FF5500] text-[#FF5500]'
                  : 'bg-[#F7F7F8] border-black/10 text-[#0D0D0D]'
              }`}
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
              <span>{isCompared ? 'Dibandingkan' : 'Bandingkan'}</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleWishlist(vehicle.id)}
              aria-label="Simpan Wishlist"
              className="w-8 h-8 rounded-full bg-[#F7F7F8] flex items-center justify-center hover:bg-[#FFF2EB] cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 ${
                  isWishlisted ? 'fill-[#FF5500] text-[#FF5500]' : 'text-[#0D0D0D]'
                }`}
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Detail"
              className="w-8 h-8 rounded-full bg-[#F7F7F8] flex items-center justify-center hover:bg-black/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Hero Gallery Card */}
          <div className="relative h-56 sm:h-64 rounded-2xl overflow-hidden bg-[#F7F7F8] border border-black/10">
            <Image
              src={galleryPhotos[photoIdx].src}
              alt={vehicle.brandModel}
              fill
              className="object-cover"
            />
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0D0D0D] text-white text-[11px] font-bold">
              {vehicle.year} • {vehicle.plateMasked}
            </span>
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/75 text-white text-[11px] font-mono font-bold">
              {photoIdx + 1} / {galleryPhotos.length}
            </span>
          </div>

          {/* Title + Rating + Price Pill */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-extrabold text-[#0D0D0D]">{vehicle.brandModel}</h2>
                <p className="text-xs text-[#6B7280] mt-0.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-bold text-[#0D0D0D]">
                    <Star className="w-3.5 h-3.5 fill-[#FF5500] text-[#FF5500]" />
                    {partner.rating.toFixed(1)}
                  </span>
                  <span>({partner.completedTrips} trip selesai)</span>
                  <span>• {item.hubName}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-2xl font-extrabold text-[#0D0D0D] tabular-nums">
                    {price ? formatRp(price.rentalTotal) : 'N/A'}
                  </span>
                </div>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#FFF2EB] text-[#FF5500] text-[11px] font-bold">
                  Final • Paket {duration} Jam
                </span>
              </div>
            </div>
          </div>

          {/* 4-Tile Quick Spec Strip (Batch 2 Sheet 5) */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: CarFront, label: 'Tipe', value: categoryLabel(vehicle.category, lang) },
              { icon: Users, label: 'Kursi', value: `${vehicle.seats} Orang` },
              { icon: Gauge, label: 'Transmisi', value: vehicle.transmission },
              { icon: Fuel, label: 'BBM', value: vehicle.fuelType },
            ].map((spec) => {
              const Icon = spec.icon;
              return (
                <div
                  key={spec.label}
                  className="rounded-2xl bg-[#F7F7F8] border border-black/5 p-2.5 text-center"
                >
                  <Icon className="w-4 h-4 text-[#FF5500] mx-auto mb-1" />
                  <p className="text-[11px] font-extrabold text-[#0D0D0D] truncate">{spec.value}</p>
                  <p className="text-[10px] text-[#6B7280]">{spec.label}</p>
                </div>
              );
            })}
          </div>

          {/* Partner Clickable Card */}
          <div className="rounded-2xl border border-black/10 bg-[#F7F7F8] p-3.5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onOpenPartner(partner)}
              className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-xl bg-[#0D0D0D] text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                {partner.businessName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#0D0D0D] group-hover:text-[#FF5500] truncate flex items-center gap-1">
                  {partner.businessName}
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                </p>
                <p className="text-[11px] text-[#6B7280] truncate">
                  ★ {partner.rating} • {partner.address}
                </p>
              </div>
            </button>
            <a
              href={`tel:${partner.phone}`}
              aria-label="Hubungi Mitra"
              className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center hover:border-[#FF5500] shrink-0"
            >
              <Phone className="w-4 h-4 text-[#0D0D0D]" />
            </a>
          </div>

          {/* 3 Single-line Sub-tabs matching Batch 2 Sheet 5 */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap">
            {[
              { id: 'overview' as const, label: 'Ringkasan & Rute' },
              { id: 'specs' as const, label: 'Spesifikasi & Syarat' },
              { id: 'gallery' as const, label: 'Galeri & Simulasi Biaya' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                  tab === t.id
                    ? 'bg-[#0D0D0D] text-white'
                    : 'bg-[#F7F7F8] text-[#0D0D0D] border border-black/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="space-y-3 text-xs">
              <div className="rounded-2xl border border-black/10 p-4 space-y-2">
                <h4 className="font-extrabold text-[#0D0D0D] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#FF5500]" />
                  Estimasi Antar-Jemput OSRM
                </h4>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Rute: {routeQuote.originName} → {routeQuote.destinationName}</span>
                  <span className="font-bold text-[#0D0D0D] tabular-nums">
                    {routeQuote.distanceKm} km (~{routeQuote.durationMinutes} mnt)
                  </span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Ongkos Antar Zona</span>
                  <span className="font-extrabold text-[#FF5500] tabular-nums">
                    {routeQuote.isFreeZone ? 'GRATIS' : formatRp(routeQuote.deliveryFee)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F7F7F8] p-4 space-y-1.5">
                <h4 className="font-extrabold text-[#0D0D0D]">Ketentuan Paket</h4>
                <p className="text-[#6B7280] leading-relaxed">
                  {mode === 'LEPAS_KUNCI'
                    ? vehicle.ratePlan.termsLepasKunci
                    : vehicle.ratePlan.termsDenganSopir}
                </p>
                {vehicle.ratePlan.fullBbmTerms && (
                  <p className="text-[#FF5500] font-semibold pt-1">
                    Opsi Full BBM: {vehicle.ratePlan.fullBbmTerms.wilayah} (maks{' '}
                    {vehicle.ratePlan.fullBbmTerms.maxKm} km)
                  </p>
                )}
              </div>
            </div>
          )}

          {tab === 'specs' && (
            <div className="rounded-2xl border border-black/10 divide-y divide-black/10 text-xs">
              {[
                ['Merek & Model', vehicle.brandModel],
                ['Tahun Perakitan', String(vehicle.year)],
                ['Transmisi', vehicle.transmission],
                ['Kapasitas Kursi & Bagasi', `${vehicle.seats} Kursi • ${vehicle.luggage} Koper`],
                ['Bahan Bakar', vehicle.fuelType],
                ['GPS Tracker Muvo', vehicle.hasGpsTracker ? 'Aktif & Terpasang' : 'Tidak tersedia'],
                ['Deposit Escrow (Lepas Kunci)', formatRp(vehicle.ratePlan.depositAmount)],
                ['Tarif Overtime', `${formatRp(vehicle.ratePlan.overtimePerHour)} / jam`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-3">
                  <span className="text-[#6B7280]">{k}</span>
                  <span className="font-bold text-[#0D0D0D] text-right">{v}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'gallery' && (
            <div className="space-y-4">
              {/* Thumbnail Strip */}
              <div className="grid grid-cols-4 gap-2">
                {galleryPhotos.map((g, idx) => (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => setPhotoIdx(idx)}
                    className={`relative h-16 rounded-xl overflow-hidden border-2 cursor-pointer ${
                      photoIdx === idx ? 'border-[#FF5500]' : 'border-transparent opacity-70'
                    }`}
                  >
                    <Image src={g.src} alt={g.label} fill className="object-cover" />
                  </button>
                ))}
              </div>

              {/* Colors */}
              <div>
                <p className="text-xs font-extrabold text-[#0D0D0D] mb-2">
                  Varian Warna Tersedia: {colors[selectedColor].name}
                </p>
                <div className="flex items-center gap-2.5">
                  {colors.map((c, idx) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(idx)}
                      aria-label={c.name}
                      className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                        selectedColor === idx ? 'border-[#FF5500] scale-110' : 'border-black/15'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Simulasi Biaya Sewa (adapted from Batch 3 Sheet 1 Calculator) */}
              <div className="rounded-2xl bg-[#F7F7F8] border border-black/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold text-[#0D0D0D] flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-[#FF5500]" />
                    Simulasi DP 30% vs Pelunasan
                  </p>
                  <div className="flex gap-1">
                    {vehicle.ratePlan.offeredDurations.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSimDuration(d)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                          simDuration === d
                            ? 'bg-[#0D0D0D] text-white'
                            : 'bg-white text-[#0D0D0D] border border-black/10'
                        }`}
                      >
                        {d}J
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center bg-white rounded-xl p-3 border border-black/5">
                  <div>
                    <p className="text-[10px] text-[#6B7280]">Total Sewa</p>
                    <p className="text-xs font-extrabold text-[#0D0D0D] tabular-nums">
                      {formatRp(simRentalTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280]">DP 30% Sekarang</p>
                    <p className="text-xs font-extrabold text-[#FF5500] tabular-nums">
                      {formatRp(simDp)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6B7280]">Sisa Serah-Terima</p>
                    <p className="text-xs font-extrabold text-[#0D0D0D] tabular-nums">
                      {formatRp(simRentalTotal - simDp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Dual CTA matching Batch 2 Sheet 5 */}
        <div className="p-4 border-t border-black/10 bg-white flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenPartner(partner)}
            className="h-12 px-4 rounded-full border border-black/15 bg-white hover:bg-[#F7F7F8] text-xs font-bold text-[#0D0D0D] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Info Mitra
          </button>
          <button
            type="button"
            disabled={!item.rateAvailable || !item.calendarAvailable}
            onClick={() => onProceedToBooking(item)}
            className="flex-1 h-12 rounded-full bg-[#0D0D0D] hover:bg-[#1a1a1a] disabled:opacity-40 text-white text-sm font-bold flex items-center justify-between px-5 cursor-pointer"
          >
            <span className="whitespace-nowrap">
              {item.calendarAvailable && item.rateAvailable
                ? 'Lanjut Booking & Jadwal'
                : 'Unit Tidak Tersedia di Jam Ini'}
            </span>
            <span className="w-8 h-8 rounded-full bg-[#FF5500] text-white flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
