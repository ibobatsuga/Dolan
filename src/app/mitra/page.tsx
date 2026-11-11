'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Download,
  Navigation,
  PlusCircle,
  Check,
  XCircle,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  AvailabilityBlock,
  Booking,
  DriverAssignment,
  DriverProfile,
  DurationHours,
  GeofenceEvent,
  GpsTelemetry,
  PartnerProfile,
  PaymentLedgerEntry,
  VehicleListing,
} from '@/lib/types';

interface PartnerDashboardData {
  partner: PartnerProfile;
  allPartners: PartnerProfile[];
  vehicles: VehicleListing[];
  blocks: AvailabilityBlock[];
  bookings: Booking[];
  drivers: DriverProfile[];
  assignments: DriverAssignment[];
  ledger: PaymentLedgerEntry[];
  telemetry: { source: string; positions: GpsTelemetry[] };
  geofenceEvents: GeofenceEvent[];
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function PartnerSaasPage() {
  const [partnerId, setPartnerId] = useState('ptr-merapi');
  const [data, setData] = useState<PartnerDashboardData | null>(null);
  const [tab, setTab] = useState<'calendar' | 'orders' | 'rates' | 'finance' | 'gps'>('calendar');
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  // Manual block form
  const todayStr = new Date().toISOString().slice(0, 10);
  const [blockVehicleId, setBlockVehicleId] = useState('');
  const [blockStart, setBlockStart] = useState(`${todayStr}T09:00`);
  const [blockEnd, setBlockEnd] = useState(`${todayStr}T15:00`);
  const [blockType, setBlockType] = useState<'MANUAL_BLOCK' | 'MAINTENANCE'>('MANUAL_BLOCK');
  const [blockReason, setBlockReason] = useState('Servis / booking offline');

  // Rate editor state
  const [rateVehicleId, setRateVehicleId] = useState('');
  const [rate6h, setRate6h] = useState(240000);
  const [rate12h, setRate12h] = useState(315000);
  const [rate24h, setRate24h] = useState(385000);

  const loadData = useCallback(async () => {
    const res = await fetch(`/api/partner?partnerId=${partnerId}`);
    const json = (await res.json()) as PartnerDashboardData;
    setData(json);
    if (json.vehicles.length > 0) {
      setBlockVehicleId((prev) =>
        json.vehicles.some((v) => v.id === prev) ? prev : json.vehicles[0].id
      );
      const firstV = json.vehicles[0];
      setRateVehicleId((prev) =>
        json.vehicles.some((v) => v.id === prev) ? prev : firstV.id
      );
      setRate6h(firstV.ratePlan.rates[6]?.UNIT_ONLY ?? firstV.ratePlan.rates[6]?.WITH_DRIVER ?? 200000);
      setRate12h(firstV.ratePlan.rates[12]?.UNIT_ONLY ?? firstV.ratePlan.rates[12]?.WITH_DRIVER ?? 300000);
      setRate24h(firstV.ratePlan.rates[24]?.UNIT_ONLY ?? firstV.ratePlan.rates[24]?.WITH_DRIVER ?? 380000);
    }
  }, [partnerId]);

  useEffect(() => {
    let active = true;
    fetch(`/api/partner?partnerId=${partnerId}`)
      .then((res) => res.json() as Promise<PartnerDashboardData>)
      .then((json) => {
        if (!active) return;
        setData(json);
        if (json.vehicles.length > 0) {
          setBlockVehicleId((prev) =>
            json.vehicles.some((v) => v.id === prev) ? prev : json.vehicles[0].id
          );
          const firstV = json.vehicles[0];
          setRateVehicleId((prev) =>
            json.vehicles.some((v) => v.id === prev) ? prev : firstV.id
          );
          setRate6h(
            firstV.ratePlan.rates[6]?.UNIT_ONLY ?? firstV.ratePlan.rates[6]?.WITH_DRIVER ?? 200000
          );
          setRate12h(
            firstV.ratePlan.rates[12]?.UNIT_ONLY ??
              firstV.ratePlan.rates[12]?.WITH_DRIVER ??
              300000
          );
          setRate24h(
            firstV.ratePlan.rates[24]?.UNIT_ONLY ??
              firstV.ratePlan.rates[24]?.WITH_DRIVER ??
              380000
          );
        }
      });
    return () => {
      active = false;
    };
  }, [partnerId]);

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch('/api/partner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_BLOCK',
        vehicleId: blockVehicleId,
        startAtIso: new Date(blockStart).toISOString(),
        endAtIso: new Date(blockEnd).toISOString(),
        blockType,
        reason: blockReason,
      }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok || !json.ok) {
      setFeedback({ ok: false, msg: json.error || 'Gagal menambah blokir.' });
    } else {
      setFeedback({ ok: true, msg: 'Blokir kalender berhasil disimpan tanpa bentrok.' });
      loadData();
    }
  };

  const handleOrderAction = async (bookingCode: string, action: 'ACCEPT' | 'REJECT') => {
    setFeedback(null);
    const res = await fetch(`/api/bookings/${bookingCode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'PARTNER_RESPOND',
        partnerAction: action,
        reason: action === 'REJECT' ? 'Unit mendadak masuk bengkel' : undefined,
      }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    setFeedback({
      ok: json.ok,
      msg: json.ok
        ? `Pesanan ${bookingCode} ${action === 'ACCEPT' ? 'diterima' : 'ditolak (refund otomatis)'}.`
        : json.error || 'Gagal memperbarui pesanan.',
    });
    loadData();
  };

  const handleAssignDriver = async (bookingCode: string, driverId: string) => {
    setFeedback(null);
    const res = await fetch(`/api/bookings/${bookingCode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ASSIGN_DRIVER', driverId }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    setFeedback({
      ok: json.ok,
      msg: json.ok
        ? `Sopir ditugaskan ke ${bookingCode} (lolos cek bentrok & jeda istirahat).`
        : json.error || 'Penugasan ditolak sistem.',
    });
    loadData();
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = data?.vehicles.find((v) => v.id === rateVehicleId);
    if (!vehicle) return;

    const updatedRates = { ...vehicle.ratePlan.rates };
    const key = vehicle.ratePlan.offeredModes.includes('LEPAS_KUNCI')
      ? 'UNIT_ONLY'
      : 'WITH_DRIVER';
    updatedRates[6] = { ...updatedRates[6], [key]: rate6h };
    updatedRates[12] = { ...updatedRates[12], [key]: rate12h };
    updatedRates[24] = { ...updatedRates[24], [key]: rate24h };

    const offered: DurationHours[] = [6, 12, 24];
    const res = await fetch('/api/partner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_RATES',
        vehicleId: rateVehicleId,
        offeredDurations: offered,
        rates: updatedRates,
        overtimePerHour: vehicle.ratePlan.overtimePerHour,
        depositAmount: vehicle.ratePlan.depositAmount,
      }),
    });
    if (res.ok) {
      setFeedback({
        ok: true,
        msg: `Versi tarif baru tersimpan untuk ${vehicle.brandModel}. Booking lama tetap memakai snapshot lama.`,
      });
      loadData();
    }
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Tanggal', 'Kode Booking', 'Jenis', 'Gateway', 'Jumlah (IDR)', 'Status Rekonsiliasi'],
      ...data.ledger.map((l) => [
        l.createdAt,
        l.bookingCode,
        l.type,
        l.gateway,
        String(l.amount),
        l.reconciled ? 'RECONCILED' : 'PENDING',
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muvo-ledger-${partnerId}.csv`;
    a.click();
  };

  const netRevenue =
    data?.bookings
      .filter((b) => b.status !== 'CANCELLED')
      .reduce((acc, b) => acc + b.priceSnapshot.partnerNetPayout, 0) ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f3f1] text-[#14171f]">
      <Navbar theme="ledger" />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Partner Header */}
        <div className="bg-white border border-[#e2e0dc] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-[#5b616e]">
              SaaS Manajemen Armada Gratis untuk Mitra Jogja • Rekening Payout: {data?.partner.payoutBankMasked}
            </span>
            <h1 className="text-2xl font-semibold mt-0.5">
              {data?.partner.businessName || 'Dashboard Mitra'}
            </h1>
            <p className="text-xs text-[#5b616e] mt-1">
              {data?.partner.address} • Perjanjian {data?.partner.agreementVersion} • Sanksi Level {data?.partner.sanctionLevel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#f4f3f1] border border-[#d8d5cf] text-sm font-medium"
            >
              {(data?.allPartners || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.businessName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Strip (Typography, not tiles with icon circles per app-screens rules) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e2e0dc] rounded-xl p-4">
            <span className="text-xs text-[#5b616e]">Unit Aktif</span>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1">
              {data?.vehicles.length ?? 0}
            </p>
          </div>
          <div className="bg-white border border-[#e2e0dc] rounded-xl p-4">
            <span className="text-xs text-[#5b616e]">Blokir Kalender & Paruh Jam</span>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1 text-[#1d5fbf]">
              {data?.blocks.length ?? 0}
            </p>
          </div>
          <div className="bg-white border border-[#e2e0dc] rounded-xl p-4">
            <span className="text-xs text-[#5b616e]">Booking Tercatat</span>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1">
              {data?.bookings.length ?? 0}
            </p>
          </div>
          <div className="bg-white border border-[#e2e0dc] rounded-xl p-4">
            <span className="text-xs text-[#5b616e]">Estimasi Payout Bersih</span>
            <p className="text-2xl font-semibold font-mono tabular-nums mt-1">
              {formatRp(netRevenue)}
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              feedback.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Navigation Tabs — 1 Single Line */}
        <div className="flex flex-nowrap items-center gap-1.5 border-b border-[#e2e0dc] pb-3 overflow-x-auto no-scrollbar">
          {(
            [
              ['calendar', 'Kalender Anti-Double-Book'],
              ['orders', 'Pesanan & Penugasan Sopir'],
              ['rates', 'Harga Mandiri 6/12/24 Jam'],
              ['finance', 'Keuangan & Payout'],
              ['gps', 'Peta GPS Traccar'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                tab === id
                  ? 'bg-[#14171f] text-white'
                  : 'bg-white border border-[#e2e0dc] text-[#4b505b] hover:bg-[#efede9]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TAB 1: CALENDAR ANTI-DOUBLE-BOOK */}
        {tab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-[#e2e0dc] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1d5fbf]" /> Jadwal Unit & Paruh Jam Pasca-6 Jam
                </h2>
                <span className="text-xs text-[#5b616e]">
                  Bentrok ditolak otomatis di level data
                </span>
              </div>

              <div className="space-y-4">
                {(data?.vehicles || []).map((v) => {
                  const vBlocks = (data?.blocks || []).filter((b) => b.vehicleId === v.id);
                  return (
                    <div key={v.id} className="border border-[#efede9] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">
                          {v.brandModel} <span className="font-mono text-xs text-[#5b616e]">({v.plateMasked})</span>
                        </span>
                        <span className="text-xs text-[#5b616e]">{vBlocks.length} jadwal aktif</span>
                      </div>
                      {vBlocks.length === 0 ? (
                        <p className="text-xs text-[#5b616e]">Kalender kosong — siap menerima booking.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {vBlocks.map((b) => (
                            <div
                              key={b.id}
                              className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-md text-xs border-l-4 ${
                                b.blockType === 'BOOKING'
                                  ? 'bg-[#f2f4f7] border-[#1d5fbf]'
                                  : b.blockType === 'POST_6H_BUFFER'
                                    ? 'bg-[#f4f3f1] border-[#14171f]'
                                    : 'bg-amber-50 border-amber-500'
                              }`}
                            >
                              <div>
                                <span className="font-semibold">{b.blockType}</span> •{' '}
                                <span className="text-[#4b505b]">{b.reason}</span>
                              </div>
                              <span className="font-mono text-[11px]">
                                {new Date(b.startAt).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                →{' '}
                                {new Date(b.endAt).toLocaleString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={handleAddBlock}
              className="lg:col-span-4 bg-white border border-[#e2e0dc] rounded-xl p-5 space-y-3 h-fit"
            >
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-[#1d5fbf]" /> Tambah Blokir Manual / Servis
              </h3>
              <p className="text-xs text-[#5b616e]">
                Uji anti-double-book: coba blokir jam yang sama dengan booking aktif (mis. 09:00–15:00), sistem akan menolak.
              </p>
              <div className="text-xs space-y-2.5">
                <div>
                  <label className="block font-medium mb-1">Unit</label>
                  <select
                    value={blockVehicleId}
                    onChange={(e) => setBlockVehicleId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-[#f4f3f1] border border-[#d8d5cf]"
                  >
                    {(data?.vehicles || []).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brandModel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Jenis Blokir</label>
                  <select
                    value={blockType}
                    onChange={(e) => setBlockType(e.target.value as 'MANUAL_BLOCK' | 'MAINTENANCE')}
                    className="w-full px-2.5 py-2 rounded-lg bg-[#f4f3f1] border border-[#d8d5cf]"
                  >
                    <option value="MANUAL_BLOCK">Blokir Manual (Tamu Langsung)</option>
                    <option value="MAINTENANCE">Jadwal Servis / Bengkel</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Mulai</label>
                  <input
                    type="datetime-local"
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-[#f4f3f1] border border-[#d8d5cf] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Selesai</label>
                  <input
                    type="datetime-local"
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-[#f4f3f1] border border-[#d8d5cf] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Alasan</label>
                  <input
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-[#f4f3f1] border border-[#d8d5cf]"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#14171f] text-white text-xs font-semibold cursor-pointer"
              >
                Simpan ke Kalender Armada
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: ORDERS & DRIVER ASSIGNMENT */}
        {tab === 'orders' && (
          <div className="bg-white border border-[#e2e0dc] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#efede9]">
              <h2 className="text-base font-semibold">Pesanan Masuk & Penugasan Sopir (Validasi Jeda 8 Jam)</h2>
            </div>
            <div className="divide-y divide-[#efede9]">
              {(data?.bookings || []).map((b) => {
                const vehicle = data?.vehicles.find((v) => v.id === b.vehicleId);
                return (
                  <div key={b.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/booking/${b.code}`} className="font-mono text-sm font-semibold text-[#1d5fbf] hover:underline">
                          {b.code}
                        </Link>
                        <span className="px-2 py-0.5 rounded bg-[#f4f3f1] text-[11px] font-semibold">
                          {b.status}
                        </span>
                        <span className="text-xs text-[#5b616e]">
                          {b.durationHours} Jam • {b.packageType}
                        </span>
                      </div>
                      <p className="text-sm font-medium">
                        {vehicle?.brandModel} — Penyewa: {b.renterName}
                      </p>
                      <p className="text-xs text-[#5b616e] font-mono">
                        {new Date(b.startAt).toLocaleString('id-ID')} →{' '}
                        {new Date(b.endAt).toLocaleString('id-ID')} • {b.pickupLocationName}
                      </p>
                    </div>

                    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                      {b.status === 'AWAITING_PARTNER' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOrderAction(b.code, 'ACCEPT')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#14171f] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Check className="w-3.5 h-3.5 shrink-0" /> Terima
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOrderAction(b.code, 'REJECT')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <XCircle className="w-3.5 h-3.5 shrink-0" /> Tolak (Unit Rusak)
                          </button>
                        </>
                      )}

                      {b.mode === 'DENGAN_SOPIR' && (
                        <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
                          <UserCheck className="w-3.5 h-3.5 text-[#1d5fbf] shrink-0" />
                          <select
                            value={b.driverId || ''}
                            onChange={(e) => {
                              if (e.target.value) handleAssignDriver(b.code, e.target.value);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#f4f3f1] border border-[#d8d5cf] text-xs font-medium whitespace-nowrap shrink-0"
                          >
                            <option value="">Pilih Sopir Bertugas...</option>
                            {(data?.drivers || []).map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: INDEPENDENT RATE PLAN PER DURATION */}
        {tab === 'rates' && (
          <form onSubmit={handleSaveRates} className="bg-white border border-[#e2e0dc] rounded-xl p-6 max-w-2xl space-y-4">
            <h2 className="text-base font-semibold">
              Manajemen Harga Mandiri per Durasi (FR-MIT-04)
            </h2>
            <p className="text-xs text-[#5b616e]">
              Harga 6 jam, 12 jam, dan 24 jam ditetapkan terpisah oleh mitra — sistem tidak menurunkan harga 6 jam sebagai setengah harga 12 jam.
            </p>
            <div className="text-xs space-y-3">
              <div>
                <label className="block font-medium mb-1">Pilih Unit</label>
                <select
                  value={rateVehicleId}
                  onChange={(e) => setRateVehicleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#f4f3f1] border border-[#d8d5cf]"
                >
                  {(data?.vehicles || []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brandModel} (Versi tarif v{v.ratePlan.version})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1">Tarif 6 Jam (IDR)</label>
                  <input
                    type="number"
                    value={rate6h}
                    onChange={(e) => setRate6h(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#f4f3f1] border border-[#d8d5cf] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Tarif 12 Jam (IDR)</label>
                  <input
                    type="number"
                    value={rate12h}
                    onChange={(e) => setRate12h(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#f4f3f1] border border-[#d8d5cf] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Tarif 24 Jam (IDR)</label>
                  <input
                    type="number"
                    value={rate24h}
                    onChange={(e) => setRate24h(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#f4f3f1] border border-[#d8d5cf] font-mono"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-[#14171f] text-white text-xs font-semibold cursor-pointer"
            >
              Simpan Versi Tarif Baru
            </button>
          </form>
        )}

        {/* TAB 4: PARTNER FINANCE LEDGER & CSV EXPORT */}
        {tab === 'finance' && (
          <div className="bg-white border border-[#e2e0dc] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#efede9] flex items-center justify-between">
              <h2 className="text-base font-semibold">Ledger Keuangan & Payout Mitra (FR-MIT-08)</h2>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14171f] text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Ekspor CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#e2e0dc] text-left text-[#5b616e]">
                    <th className="py-3 px-4 font-medium">Booking</th>
                    <th className="py-3 px-4 font-medium">Jenis Transaksi</th>
                    <th className="py-3 px-4 font-medium">Gateway</th>
                    <th className="py-3 px-4 font-medium">Keterangan</th>
                    <th className="py-3 px-4 font-medium text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efede9]">
                  {(data?.ledger || []).map((row) => (
                    <tr key={row.id}>
                      <td className="py-3 px-4 font-mono font-semibold">{row.bookingCode}</td>
                      <td className="py-3 px-4">{row.type}</td>
                      <td className="py-3 px-4 font-mono">{row.gateway}</td>
                      <td className="py-3 px-4 text-[#5b616e]">{row.reason}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                        {formatRp(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PARTNER TRACCAR GPS */}
        {tab === 'gps' && (
          <div className="bg-white border border-[#e2e0dc] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#1d5fbf]" /> Status Perangkat GPS Traccar ({data?.telemetry.source})
              </h2>
              <span className="text-xs text-[#5b616e]">
                Pelacakan aktif selama booking berjalan saja (FR-MIT-11)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(data?.telemetry.positions || []).map((pos) => {
                const v = data?.vehicles.find((veh) => veh.id === pos.vehicleId);
                return (
                  <div key={pos.gpsDeviceId} className="border border-[#e2e0dc] rounded-lg p-4 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-semibold">
                      <span>{v?.brandModel || pos.vehicleId}</span>
                      <span className={pos.isOnline ? 'text-emerald-700' : 'text-red-700'}>
                        {pos.isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                    <p className="font-mono text-[#5b616e]">
                      Device: {pos.gpsDeviceId} • Booking: {pos.bookingId || 'Standby'}
                    </p>
                    <p className="font-mono">
                      Koordinat: {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} • {pos.speedKmh} km/j
                    </p>
                    <p>
                      Geofence DIY:{' '}
                      <strong className={pos.insideGeofence ? 'text-emerald-700' : 'text-red-700'}>
                        {pos.insideGeofence ? 'Di dalam zona' : 'Keluar batas zona'}
                      </strong>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
