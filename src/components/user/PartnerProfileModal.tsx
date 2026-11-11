'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import { PartnerProfile } from '@/lib/types';
import { formatRp, MarketplaceSearchItem } from './types';

interface PartnerProfileModalProps {
  partner: PartnerProfile | null;
  partnerVehicles: MarketplaceSearchItem[];
  onClose: () => void;
  onSelectVehicle: (item: MarketplaceSearchItem) => void;
}

const SAMPLE_REVIEWS = [
  {
    id: 'rev-1',
    name: 'Bagas Prakoso',
    rating: 5,
    date: '2 hari lalu',
    car: 'Toyota Avanza / MPV Keluarga',
    text: 'Unit sangat bersih, wangi, diantar tepat waktu di Stasiun Tugu. Harga akhir sesuai yang tertera di Muvo.',
  },
  {
    id: 'rev-2',
    name: 'Clara Setyawati',
    rating: 5,
    date: '5 hari lalu',
    car: 'Honda Brio RS',
    text: 'Verifikasi KTP & SIM cepat sekali, proses serah-terima transparan pakai foto checklist.',
  },
  {
    id: 'rev-3',
    name: 'Andi Wijanarko',
    rating: 4,
    date: '1 minggu lalu',
    car: 'Innova Zenix Hybrid',
    text: 'Sopir sangat ramah dan hafal rute wisata Gunungkidul & Borobudur tanpa nyasar.',
  },
];

export function PartnerProfileModal({
  partner,
  partnerVehicles,
  onClose,
  onSelectVehicle,
}: PartnerProfileModalProps) {
  const [tab, setTab] = useState<'overview' | 'inventory' | 'reviews'>('overview');
  const [chatPing, setChatPing] = useState(false);

  if (!partner) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden border border-black/10 shadow-2xl">
        {/* Top Bar */}
        <div className="px-5 py-3.5 border-b border-black/10 flex items-center justify-between">
          <span className="text-sm font-extrabold text-[#0D0D0D]">Profil Mitra Rental</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Profil Mitra"
            className="w-8 h-8 rounded-full bg-[#F7F7F8] flex items-center justify-center hover:bg-black/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          {/* Hero banner matching Batch 2 Sheet 3 */}
          <div className="relative h-36 bg-[#0D0D0D]">
            <Image
              src="/images/hero-jogja.jpg"
              alt={partner.businessName}
              fill
              className="object-cover opacity-55"
            />
            <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0D0D0D]/85 text-white text-[11px] font-bold border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF5500]" />
              Mitra Terverifikasi Muvo
            </div>
          </div>

          <div className="px-5 -mt-8 relative z-10 space-y-4">
            <div className="bg-white rounded-2xl border border-black/10 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0D0D0D] text-white font-extrabold text-lg flex items-center justify-center shrink-0">
                    {partner.businessName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#0D0D0D]">
                      {partner.businessName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-0.5">
                      <span className="inline-flex items-center gap-1 font-bold text-[#0D0D0D]">
                        <Star className="w-3.5 h-3.5 fill-[#FF5500] text-[#FF5500]" />
                        {partner.rating.toFixed(1)}
                      </span>
                      <span>• {partner.completedTrips}+ Trip Selesai</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-[#FF5500] shrink-0" />
                      {partner.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Action Buttons matching Reference */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                <a
                  href={`tel:${partner.phone}`}
                  className="rounded-xl bg-[#F7F7F8] hover:bg-[#FFF2EB] py-2 flex flex-col items-center gap-1 text-[11px] font-bold text-[#0D0D0D]"
                >
                  <Phone className="w-4 h-4 text-[#FF5500]" />
                  <span>Telepon</span>
                </a>
                <button
                  type="button"
                  onClick={() => setTab('inventory')}
                  className="rounded-xl bg-[#F7F7F8] hover:bg-[#FFF2EB] py-2 flex flex-col items-center gap-1 text-[11px] font-bold text-[#0D0D0D] cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-[#FF5500]" />
                  <span>Armada ({partnerVehicles.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChatPing(true)}
                  className="rounded-xl bg-[#F7F7F8] hover:bg-[#FFF2EB] py-2 flex flex-col items-center gap-1 text-[11px] font-bold text-[#0D0D0D] cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-[#FF5500]" />
                  <span>Chat Mitra</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('reviews')}
                  className="rounded-xl bg-[#F7F7F8] hover:bg-[#FFF2EB] py-2 flex flex-col items-center gap-1 text-[11px] font-bold text-[#0D0D0D] cursor-pointer"
                >
                  <Star className="w-4 h-4 text-[#FF5500]" />
                  <span>Ulasan</span>
                </button>
              </div>

              {chatPing && (
                <div className="mt-3 rounded-xl bg-[#FFF2EB] border border-[#FF5500]/30 p-2.5 text-xs font-semibold text-[#0D0D0D]">
                  Pesan cepat terkirim ke PIC {partner.picName} ({partner.businessName}). Rata-rata
                  respons {partner.responseRatePct}% (&lt;15 menit).
                </div>
              )}
            </div>

            {/* Single-line Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar flex-nowrap">
              {[
                { id: 'overview' as const, label: 'Ringkasan Mitra' },
                { id: 'inventory' as const, label: `Armada (${partnerVehicles.length})` },
                { id: 'reviews' as const, label: 'Ulasan Penyewa (230)' },
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
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#F7F7F8] border border-black/5 p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Penanggung Jawab</span>
                    <span className="font-bold text-[#0D0D0D]">{partner.picName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Tingkat Respons</span>
                    <span className="font-bold text-[#FF5500] tabular-nums">
                      {partner.responseRatePct}% Cepat
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Jam Operasional</span>
                    <span className="font-bold text-[#0D0D0D]">06:00 – 22:00 WIB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Standar Perjanjian</span>
                    <span className="font-mono font-semibold text-[#0D0D0D]">
                      {partner.agreementVersion}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 p-4 space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0D0D0D]">
                    Mengapa Pilih Mitra Ini
                  </h4>
                  {[
                    'Unit rutin dicek rem, ban, AC & disinfeksi sebelum serah-terima',
                    'Tarif final transparan tanpa biaya tambahan mendadak',
                    'Checklist foto pickup & return tercatat resmi di sistem Muvo',
                  ].map((item) => (
                    <p key={item} className="text-xs text-[#6B7280] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#FF5500] shrink-0" />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {tab === 'inventory' && (
              <div className="space-y-2.5">
                {partnerVehicles.map((item) => (
                  <div
                    key={item.vehicle.id}
                    className="rounded-2xl border border-black/10 p-3 flex items-center gap-3 bg-white hover:border-[#FF5500] transition-colors"
                  >
                    <div className="relative w-24 h-18 rounded-xl overflow-hidden bg-[#F7F7F8] shrink-0">
                      <Image
                        src={item.vehicle.photo}
                        alt={item.vehicle.brandModel}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-[#0D0D0D] truncate">
                        {item.vehicle.brandModel}
                      </p>
                      <p className="text-[11px] text-[#6B7280]">
                        {item.vehicle.transmission} • {item.vehicle.seats} Kursi • {item.hubName}
                      </p>
                      <p className="text-sm font-extrabold text-[#FF5500] mt-1 tabular-nums">
                        {item.price ? formatRp(item.price.rentalTotal) : 'Cek Paket Lain'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectVehicle(item);
                      }}
                      className="px-3.5 py-2 rounded-full bg-[#0D0D0D] hover:bg-[#FF5500] text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Lihat Unit
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tab === 'reviews' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#F7F7F8] p-4 flex items-center gap-5 border border-black/5">
                  <div className="text-center shrink-0">
                    <p className="text-4xl font-extrabold text-[#0D0D0D] tabular-nums">
                      {partner.rating.toFixed(1)}
                    </p>
                    <p className="text-[11px] text-[#6B7280] font-semibold">230 Ulasan</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[
                      { star: 5, pct: 80, count: 184 },
                      { star: 4, pct: 14, count: 32 },
                      { star: 3, pct: 4, count: 9 },
                      { star: 2, pct: 1, count: 3 },
                      { star: 1, pct: 1, count: 2 },
                    ].map((row) => (
                      <div key={row.star} className="flex items-center gap-2 text-[11px]">
                        <span className="w-7 font-bold text-[#0D0D0D]">{row.star}★</span>
                        <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                          <div
                            className="h-full bg-[#FF5500] rounded-full"
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                        <span className="w-7 text-right text-[#6B7280] tabular-nums">
                          {row.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {SAMPLE_REVIEWS.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-black/10 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-[#0D0D0D]">{r.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#FFF2EB] text-[#FF5500] text-[10px] font-bold">
                            Verified Renter
                          </span>
                        </div>
                        <span className="text-[11px] text-[#6B7280]">{r.date}</span>
                      </div>
                      <p className="text-xs text-[#6B7280] leading-relaxed">{r.text}</p>
                      <p className="text-[11px] font-semibold text-[#0D0D0D]">Unit: {r.car}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
