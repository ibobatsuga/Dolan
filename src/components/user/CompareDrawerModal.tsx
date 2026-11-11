'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, X, XCircle } from 'lucide-react';
import { categoryLabel, formatRp, MarketplaceSearchItem } from './types';

interface CompareDrawerModalProps {
  open: boolean;
  onClose: () => void;
  items: MarketplaceSearchItem[];
  onRemove: (vehicleId: string) => void;
  onSelectForBooking: (item: MarketplaceSearchItem) => void;
  lang: 'id' | 'en';
}

export function CompareDrawerModal({
  open,
  onClose,
  items,
  onRemove,
  onSelectForBooking,
  lang,
}: CompareDrawerModalProps) {
  const [tab, setTab] = useState<'overview' | 'performance' | 'features'>('overview');

  if (!open) return null;

  const list = items.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-black/10 shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#0D0D0D]">Bandingkan Mobil</h3>
            <p className="text-[11px] text-[#6B7280]">
              Bandingkan hingga 3 unit pilihan secara berdampingan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Perbandingan"
            className="w-8 h-8 rounded-full bg-[#F7F7F8] flex items-center justify-center hover:bg-black/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {list.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-bold text-[#0D0D0D]">Belum ada unit untuk dibandingkan</p>
            <p className="text-xs text-[#6B7280]">
              Klik tombol &ldquo;+ Bandingkan&rdquo; pada kartu mobil untuk membandingkan harga dan
              fiturnya.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Top Car Header Cards with VS badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {list.map((item, idx) => (
                <div
                  key={item.vehicle.id}
                  className="relative rounded-2xl bg-[#F7F7F8] border border-black/10 p-3 flex flex-col justify-between"
                >
                  <button
                    type="button"
                    onClick={() => onRemove(item.vehicle.id)}
                    aria-label="Hapus"
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white border border-black/10 flex items-center justify-center hover:bg-black hover:text-white cursor-pointer z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {idx > 0 && (
                    <span className="hidden sm:flex absolute -left-3.5 top-12 w-7 h-7 rounded-full bg-[#0D0D0D] text-white text-[10px] font-extrabold items-center justify-center border-2 border-white z-10">
                      VS
                    </span>
                  )}
                  <div className="relative h-24 w-full rounded-xl overflow-hidden bg-white mb-2">
                    <Image
                      src={item.vehicle.photo}
                      alt={item.vehicle.brandModel}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-xs font-extrabold text-[#0D0D0D] line-clamp-1">
                    {item.vehicle.brandModel}
                  </p>
                  <p className="text-[11px] text-[#6B7280]">
                    {item.vehicle.year} • {item.vehicle.transmission}
                  </p>
                  <p className="text-sm font-extrabold text-[#FF5500] mt-1 tabular-nums">
                    {item.price ? formatRp(item.price.rentalTotal) : 'N/A'}
                  </p>
                </div>
              ))}
            </div>

            {/* Single-line Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap">
              {[
                { id: 'overview' as const, label: 'Ringkasan' },
                { id: 'performance' as const, label: 'Skor & Tarif' },
                { id: 'features' as const, label: 'Fitur & Syarat' },
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
              <div className="rounded-2xl border border-black/10 overflow-hidden divide-y divide-black/10 text-xs">
                {[
                  {
                    label: 'Kategori',
                    render: (i: MarketplaceSearchItem) => categoryLabel(i.vehicle.category, lang),
                  },
                  {
                    label: 'Tahun & Transmisi',
                    render: (i: MarketplaceSearchItem) =>
                      `${i.vehicle.year} • ${i.vehicle.transmission}`,
                  },
                  {
                    label: 'Kapasitas',
                    render: (i: MarketplaceSearchItem) =>
                      `${i.vehicle.seats} Kursi • ${i.vehicle.luggage} Koper`,
                  },
                  {
                    label: 'Bahan Bakar',
                    render: (i: MarketplaceSearchItem) => i.vehicle.fuelType,
                  },
                  {
                    label: 'Mitra & Rating',
                    render: (i: MarketplaceSearchItem) =>
                      `${i.partner.businessName} (★ ${i.partner.rating})`,
                  },
                  {
                    label: 'Ongkos Antar OSRM',
                    render: (i: MarketplaceSearchItem) =>
                      i.routeQuote.isFreeZone
                        ? 'Gratis (Free Zone)'
                        : `${formatRp(i.routeQuote.deliveryFee)} (${i.routeQuote.distanceKm} km)`,
                  },
                  {
                    label: 'Deposit Lepas Kunci',
                    render: (i: MarketplaceSearchItem) => formatRp(i.vehicle.ratePlan.depositAmount),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 bg-white items-center"
                  >
                    <span className="font-bold text-[#6B7280]">{row.label}</span>
                    <div className="sm:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {list.map((item) => (
                        <span key={item.vehicle.id} className="font-semibold text-[#0D0D0D]">
                          {row.render(item)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'performance' && (
              <div className="space-y-3">
                {[
                  {
                    title: 'Kapasitas Penumpang (Maks 14 Kursi)',
                    valueOf: (i: MarketplaceSearchItem) => `${i.vehicle.seats} Kursi`,
                    pctOf: (i: MarketplaceSearchItem) => Math.min(100, (i.vehicle.seats / 14) * 100),
                  },
                  {
                    title: 'Kapasitas Bagasi Koper',
                    valueOf: (i: MarketplaceSearchItem) => `${i.vehicle.luggage} Koper`,
                    pctOf: (i: MarketplaceSearchItem) =>
                      Math.min(100, (i.vehicle.luggage / 10) * 100),
                  },
                  {
                    title: 'Kecepatan Respons Mitra',
                    valueOf: (i: MarketplaceSearchItem) => `${i.partner.responseRatePct}%`,
                    pctOf: (i: MarketplaceSearchItem) => i.partner.responseRatePct,
                  },
                  {
                    title: 'Rating Kepuasan Penyewa',
                    valueOf: (i: MarketplaceSearchItem) => `${i.partner.rating} / 5.0`,
                    pctOf: (i: MarketplaceSearchItem) => (i.partner.rating / 5) * 100,
                  },
                ].map((metric) => (
                  <div
                    key={metric.title}
                    className="rounded-2xl bg-[#F7F7F8] border border-black/5 p-3.5 space-y-2"
                  >
                    <p className="text-xs font-extrabold text-[#0D0D0D]">{metric.title}</p>
                    <div className="space-y-1.5">
                      {list.map((item) => (
                        <div key={item.vehicle.id} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span>{item.vehicle.brandModel}</span>
                            <span className="tabular-nums text-[#FF5500] font-bold">
                              {metric.valueOf(item)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-black/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#FF5500]"
                              style={{ width: `${metric.pctOf(item)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'features' && (
              <div className="rounded-2xl border border-black/10 divide-y divide-black/10 text-xs">
                {[
                  {
                    label: 'GPS Tracker Muvo Aktif',
                    check: (i: MarketplaceSearchItem) => i.vehicle.hasGpsTracker,
                  },
                  {
                    label: 'Gratis Antar ke Titik Dipilih',
                    check: (i: MarketplaceSearchItem) => i.routeQuote.isFreeZone,
                  },
                  {
                    label: 'Opsi Lepas Kunci',
                    check: (i: MarketplaceSearchItem) =>
                      i.vehicle.ratePlan.offeredModes.includes('LEPAS_KUNCI'),
                  },
                  {
                    label: 'Opsi Full BBM + Sopir',
                    check: (i: MarketplaceSearchItem) =>
                      Boolean(i.vehicle.ratePlan.fullBbmTerms),
                  },
                  {
                    label: 'Tersedia di Jadwal Pilihanmu',
                    check: (i: MarketplaceSearchItem) => i.calendarAvailable && i.rateAvailable,
                  },
                ].map((feat) => (
                  <div
                    key={feat.label}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 bg-white items-center"
                  >
                    <span className="font-semibold text-[#0D0D0D]">{feat.label}</span>
                    <div className="sm:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {list.map((item) => {
                        const ok = feat.check(item);
                        return (
                          <div key={item.vehicle.id} className="flex items-center gap-1.5">
                            {ok ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                            )}
                            <span className="text-[11px] font-medium text-[#6B7280] truncate">
                              {item.vehicle.brandModel.split(' ')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick book buttons per vehicle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {list.map((item) => (
                <button
                  key={item.vehicle.id}
                  type="button"
                  disabled={!item.rateAvailable || !item.calendarAvailable}
                  onClick={() => {
                    onClose();
                    onSelectForBooking(item);
                  }}
                  className="h-11 rounded-full bg-[#0D0D0D] hover:bg-[#FF5500] disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 px-4 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <span>Pilih {item.vehicle.brandModel.split(' ')[0]}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
