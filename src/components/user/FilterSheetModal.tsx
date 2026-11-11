'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { DurationHours, PackageType, PickupPoint, RentalMode, VehicleCategory } from '@/lib/types';
import { formatRp, SortOption } from './types';

interface FilterSheetModalProps {
  open: boolean;
  onClose: () => void;
  sortBy: SortOption;
  onChangeSort: (v: SortOption) => void;
  duration: DurationHours;
  onChangeDuration: (d: DurationHours) => void;
  mode: RentalMode;
  onChangeMode: (m: RentalMode) => void;
  packageType: PackageType;
  onChangePackage: (p: PackageType) => void;
  pickupPointId: string;
  onChangePickup: (id: string) => void;
  pickupPoints: PickupPoint[];
  category: 'ALL' | VehicleCategory;
  onChangeCategory: (c: 'ALL' | VehicleCategory) => void;
  transmission: 'ALL' | 'MATIC' | 'MANUAL';
  onChangeTransmission: (t: 'ALL' | 'MATIC' | 'MANUAL') => void;
  minSeats: number;
  onChangeMinSeats: (n: number) => void;
  maxPrice: number;
  onChangeMaxPrice: (n: number) => void;
  freeDeliveryOnly: boolean;
  onChangeFreeDelivery: (b: boolean) => void;
  gpsOnly: boolean;
  onChangeGpsOnly: (b: boolean) => void;
  onReset: () => void;
  resultCount: number;
}

export function FilterSheetModal({
  open,
  onClose,
  sortBy,
  onChangeSort,
  duration,
  onChangeDuration,
  mode,
  onChangeMode,
  packageType,
  onChangePackage,
  pickupPointId,
  onChangePickup,
  pickupPoints,
  category,
  onChangeCategory,
  transmission,
  onChangeTransmission,
  minSeats,
  onChangeMinSeats,
  maxPrice,
  onChangeMaxPrice,
  freeDeliveryOnly,
  onChangeFreeDelivery,
  gpsOnly,
  onChangeGpsOnly,
  onReset,
  resultCount,
}: FilterSheetModalProps) {
  if (!open) return null;

  const sortOptions: Array<{ id: SortOption; label: string }> = [
    { id: 'recommended', label: 'Paling Sesuai' },
    { id: 'price_asc', label: 'Harga Terendah' },
    { id: 'price_desc', label: 'Harga Tertinggi' },
    { id: 'rating_desc', label: 'Rating Tertinggi' },
    { id: 'nearest', label: 'Terdekat OSRM' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden border border-black/10 shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Filter"
            className="w-8 h-8 rounded-full bg-[#F7F7F8] flex items-center justify-center hover:bg-black/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="text-sm font-extrabold text-[#0D0D0D] flex items-center gap-1.5 whitespace-nowrap">
            <SlidersHorizontal className="w-4 h-4 text-[#FF5500]" />
            Urutkan & Filter Lanjutan
          </span>
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-bold text-[#FF5500] hover:underline cursor-pointer whitespace-nowrap"
          >
            Reset
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Sort By */}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#0D0D0D] mb-2">
              Urutkan Berdasarkan
            </p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap pb-1">
              {sortOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeSort(opt.id)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    sortBy === opt.id
                      ? 'bg-[#0D0D0D] text-white'
                      : 'bg-[#F7F7F8] text-[#0D0D0D] border border-black/10 hover:border-[#FF5500]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Package */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#F7F7F8] p-3 border border-black/5">
              <p className="text-[11px] font-bold uppercase text-[#6B7280] mb-2">Durasi Paket</p>
              <div className="flex gap-1.5 flex-nowrap">
                {([6, 12, 24] as DurationHours[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onChangeDuration(d)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                      duration === d
                        ? 'bg-[#0D0D0D] text-white'
                        : 'bg-white text-[#0D0D0D] border border-black/10'
                    }`}
                  >
                    {d} Jam
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[#F7F7F8] p-3 border border-black/5">
              <p className="text-[11px] font-bold uppercase text-[#6B7280] mb-2">Mode Layanan</p>
              <div className="flex gap-1.5 flex-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    onChangeMode('LEPAS_KUNCI');
                    onChangePackage('UNIT_ONLY');
                  }}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                    mode === 'LEPAS_KUNCI'
                      ? 'bg-[#0D0D0D] text-white'
                      : 'bg-white text-[#0D0D0D] border border-black/10'
                  }`}
                >
                  Lepas Kunci
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeMode('DENGAN_SOPIR');
                    if (packageType === 'UNIT_ONLY') onChangePackage('WITH_DRIVER');
                  }}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                    mode === 'DENGAN_SOPIR'
                      ? 'bg-[#0D0D0D] text-white'
                      : 'bg-white text-[#0D0D0D] border border-black/10'
                  }`}
                >
                  Dengan Sopir
                </button>
              </div>
            </div>
          </div>

          {mode === 'DENGAN_SOPIR' && (
            <div className="rounded-2xl bg-[#FFF2EB] border border-[#FF5500]/25 p-3">
              <p className="text-[11px] font-bold uppercase text-[#FF5500] mb-2">
                Opsi Paket Sopir
              </p>
              <div className="flex gap-2 flex-nowrap">
                <button
                  type="button"
                  onClick={() => onChangePackage('WITH_DRIVER')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                    packageType === 'WITH_DRIVER'
                      ? 'bg-[#0D0D0D] text-white'
                      : 'bg-white text-[#0D0D0D] border border-black/10'
                  }`}
                >
                  Unit + Sopir
                </button>
                <button
                  type="button"
                  onClick={() => onChangePackage('FULL_BBM_DRIVER')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                    packageType === 'FULL_BBM_DRIVER'
                      ? 'bg-[#FF5500] text-white'
                      : 'bg-white text-[#0D0D0D] border border-black/10'
                  }`}
                >
                  Full BBM + Sopir
                </button>
              </div>
            </div>
          )}

          {/* Pickup Hub */}
          <div className="rounded-2xl bg-[#F7F7F8] border border-black/5 p-3.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-[#0D0D0D]">Titik Ambil / Antar (OSRM)</span>
              <span className="text-[11px] text-[#FF5500] font-semibold">Hitung Ongkir Otomatis</span>
            </div>
            <select
              value={pickupPointId}
              onChange={(e) => onChangePickup(e.target.value)}
              className="w-full h-10 rounded-xl bg-white border border-black/15 px-3 text-xs font-semibold text-[#0D0D0D] focus:outline-none"
            >
              {pickupPoints.map((pp) => (
                <option key={pp.id} value={pp.id}>
                  {pp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#0D0D0D] mb-2">
              Kategori Mobil
            </p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap">
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
                  onClick={() => onChangeCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                    category === cat.id
                      ? 'bg-[#0D0D0D] text-white'
                      : 'bg-[#F7F7F8] text-[#0D0D0D] border border-black/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transmission & Seats */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-bold text-[#0D0D0D] mb-2">Transmisi</p>
              <div className="flex gap-1.5 flex-nowrap">
                {(['ALL', 'MATIC', 'MANUAL'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChangeTransmission(t)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                      transmission === t
                        ? 'bg-[#0D0D0D] text-white'
                        : 'bg-[#F7F7F8] text-[#0D0D0D] border border-black/10'
                    }`}
                  >
                    {t === 'ALL' ? 'Semua' : t === 'MATIC' ? 'Matic' : 'Manual'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[#0D0D0D] mb-2">Minimal Kursi</p>
              <div className="flex gap-1.5 flex-nowrap">
                {[0, 5, 7, 12].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChangeMinSeats(s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                      minSeats === s
                        ? 'bg-[#0D0D0D] text-white'
                        : 'bg-[#F7F7F8] text-[#0D0D0D] border border-black/10'
                    }`}
                  >
                    {s === 0 ? 'All' : `${s}+`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Max Price Slider */}
          <div className="rounded-2xl bg-[#F7F7F8] border border-black/5 p-3.5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-[#0D0D0D]">Batas Harga Maksimal</span>
              <span className="font-extrabold text-[#FF5500] tabular-nums">
                {maxPrice >= 2000000 ? 'Semua Harga' : formatRp(maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min={250000}
              max={2000000}
              step={50000}
              value={maxPrice}
              onChange={(e) => onChangeMaxPrice(Number(e.target.value))}
              className="w-full accent-[#FF5500] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#6B7280] mt-1 tabular-nums">
              <span>Rp 250rb</span>
              <span>Rp 1 jt</span>
              <span>Rp 2 jt+</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="flex items-center justify-between rounded-2xl bg-[#F7F7F8] px-4 py-3 cursor-pointer">
              <span className="text-xs font-bold text-[#0D0D0D]">
                Hanya Zona Gratis Antar-Jemput
              </span>
              <input
                type="checkbox"
                checked={freeDeliveryOnly}
                onChange={(e) => onChangeFreeDelivery(e.target.checked)}
                className="w-4 h-4 accent-[#FF5500]"
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl bg-[#F7F7F8] px-4 py-3 cursor-pointer">
              <span className="text-xs font-bold text-[#0D0D0D]">
                Unit dengan GPS Tracker Aktif
              </span>
              <input
                type="checkbox"
                checked={gpsOnly}
                onChange={(e) => onChangeGpsOnly(e.target.checked)}
                className="w-4 h-4 accent-[#FF5500]"
              />
            </label>
          </div>
        </div>

        {/* Sticky Footer CTA matching Reference Screen 1 */}
        <div className="p-4 border-t border-black/10 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-full bg-[#0D0D0D] hover:bg-[#1a1a1a] text-white text-sm font-bold flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <span>Tampilkan Unit</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FF5500] text-white text-xs font-extrabold tabular-nums">
              {resultCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
