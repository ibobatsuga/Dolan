'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Fuel,
  Navigation,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  Booking,
  DriverProfile,
  DurationHours,
  PartnerProfile,
  PaymentLedgerEntry,
  Province,
  VehicleListing,
} from '@/lib/types';

interface BookingDetailResponse {
  booking: Booking;
  vehicle: VehicleListing;
  partner: PartnerProfile;
  driver?: DriverProfile;
  province: Province;
  ledger: PaymentLedgerEntry[];
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function BookingVoucherPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [detail, setDetail] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Checklist form state
  const [stage, setStage] = useState<'PICKUP' | 'RETURN'>('RETURN');
  const [fuelPct, setFuelPct] = useState(75);
  const [odometerKm, setOdometerKm] = useState(24920);
  const [notes, setNotes] = useState('Unit kembali bersih, indikator BBM wajar.');
  const [actor, setActor] = useState<'RENTER' | 'PARTNER'>('RENTER');

  const loadBooking = useCallback(async () => {
    const res = await fetch(`/api/bookings/${code}`);
    if (res.ok) {
      const json = (await res.json()) as BookingDetailResponse;
      setDetail(json);
    } else {
      setDetail(null);
    }
    setLoading(false);
  }, [code]);

  useEffect(() => {
    let active = true;
    fetch(`/api/bookings/${code}`).then(async (res) => {
      if (!active) return;
      if (res.ok) {
        const json = (await res.json()) as BookingDetailResponse;
        setDetail(json);
      } else {
        setDetail(null);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [code]);

  const handleExtend = async (targetDuration: DurationHours) => {
    setActionMsg(null);
    const res = await fetch(`/api/bookings/${code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'EXTEND', targetDuration }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string; additionalFee?: number };
    if (!res.ok || !json.ok) {
      setActionMsg({ type: 'err', text: json.error || 'Perpanjangan ditolak sistem.' });
    } else {
      setActionMsg({
        type: 'ok',
        text: `Durasi diperpanjang ke ${targetDuration} jam (+${formatRp(json.additionalFee ?? 0)}).`,
      });
      loadBooking();
    }
  };

  const handleCancel = async () => {
    setActionMsg(null);
    const res = await fetch(`/api/bookings/${code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CANCEL', cancelledBy: 'RENTER' }),
    });
    const json = (await res.json()) as {
      ok: boolean;
      error?: string;
      refundAmount?: number;
      ruleApplied?: string;
    };
    if (!res.ok || !json.ok) {
      setActionMsg({ type: 'err', text: json.error || 'Gagal membatalkan.' });
    } else {
      setActionMsg({
        type: 'ok',
        text: `${json.ruleApplied} Dana kembali: ${formatRp(json.refundAmount ?? 0)}.`,
      });
      loadBooking();
    }
  };

  const handleChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(null);
    const res = await fetch(`/api/bookings/${code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CHECKLIST',
        stage,
        fuelLevelPct: fuelPct,
        odometerKm,
        notes,
        actor,
      }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok || !json.ok) {
      setActionMsg({ type: 'err', text: json.error || 'Checklist gagal dikirim.' });
    } else {
      setActionMsg({
        type: 'ok',
        text: `Konfirmasi checklist ${stage} oleh ${actor} tercatat dengan watermark waktu server.`,
      });
      loadBooking();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e6dbc7] text-[#062b8a]">
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Pencarian
          </Link>
          <div className="flex gap-2 text-xs">
            <Link
              href="/booking/DLN-DIY-2601"
              className="px-3 py-1 rounded-md bg-[#faf7f0] border border-[#062b8a]/25 font-mono font-semibold"
            >
              DLN-DIY-2601
            </Link>
            <Link
              href="/booking/DLN-DIY-2602"
              className="px-3 py-1 rounded-md bg-[#faf7f0] border border-[#062b8a]/25 font-mono font-semibold"
            >
              DLN-DIY-2602
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="h-96 rounded-2xl bg-[#faf7f0]/70 animate-pulse" />
        ) : !detail ? (
          <div className="rounded-2xl bg-[#faf7f0] border-2 border-[#062b8a] p-8 text-center">
            <h1 className="text-2xl font-semibold mb-2">Voucher {code} tidak ditemukan</h1>
            <p className="text-sm text-[#3a5aa8]">
              Pilih voucher sampel di atas atau buat booking baru dari halaman pencarian.
            </p>
          </div>
        ) : (
          <div className="voucher-ticket rounded-2xl border-2 border-[#062b8a] overflow-hidden">
            {/* Voucher Header */}
            <div className="p-6 sm:p-8 bg-[#062b8a] text-[#e6dbc7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest opacity-80">
                  Voucher Booking Resmi Dolan • {detail.province.name}
                </span>
                <h1 className="text-3xl font-semibold font-mono tracking-tight mt-1">
                  {detail.booking.code}
                </h1>
                <p className="text-sm opacity-85 mt-1">
                  {detail.vehicle.brandModel} ({detail.vehicle.plateMasked}) • {detail.partner.businessName}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-[#e6dbc7] text-[#062b8a] text-xs font-semibold">
                  STATUS: {detail.booking.status}
                </span>
                <p className="text-xs mt-2 opacity-80 font-mono">
                  Kebijakan: {detail.booking.policyVersion}
                </p>
              </div>
            </div>

            {actionMsg && (
              <div
                className={`mx-6 mt-6 p-3.5 rounded-xl text-xs font-semibold border ${
                  actionMsg.type === 'ok'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}
              >
                {actionMsg.text}
              </div>
            )}

            {/* Trip Timing & Route Snapshot */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-b-4 border-dotted border-[#ddd0b9]">
              <div className="space-y-3 text-sm">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Detail Jemput & Durasi
                </h2>
                <div className="rounded-xl bg-[#e6dbc7]/45 p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#3a5aa8]">Penyewa</span>
                    <span className="font-semibold">
                      {detail.booking.renterName} ({detail.booking.renterPhone})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3a5aa8]">Titik Ambil</span>
                    <span className="font-semibold">{detail.booking.pickupLocationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3a5aa8]">Durasi & Mode</span>
                    <span className="font-semibold">
                      {detail.booking.durationHours} Jam •{' '}
                      {detail.booking.packageType === 'FULL_BBM_DRIVER'
                        ? 'Paket Full BBM + Sopir'
                        : detail.booking.mode === 'DENGAN_SOPIR'
                          ? 'Dengan Sopir'
                          : 'Lepas Kunci'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3a5aa8]">Mulai → Selesai</span>
                    <span className="font-mono font-semibold">
                      {new Date(detail.booking.startAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      →{' '}
                      {new Date(detail.booking.endAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3a5aa8]">Rute Antar ({detail.booking.routeQuote.source})</span>
                    <span className="font-mono">
                      {detail.booking.routeQuote.distanceKm} km (~{detail.booking.routeQuote.durationMinutes} mnt)
                    </span>
                  </div>
                  {detail.driver && (
                    <div className="flex justify-between pt-1 border-t border-[#062b8a]/15">
                      <span className="text-[#3a5aa8]">Sopir Bertugas</span>
                      <span className="font-semibold">
                        {detail.driver.name} ({detail.driver.phone})
                      </span>
                    </div>
                  )}
                </div>

                {detail.booking.packageSnapshot && (
                  <div className="rounded-xl border border-[#062b8a]/25 p-4 text-xs space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5" /> Batas Paket Full BBM + Sopir (Terkunci)
                    </div>
                    <p>Wilayah: {detail.booking.packageSnapshot.wilayah}</p>
                    <p>Batas Jarak: {detail.booking.packageSnapshot.maxKm} km</p>
                    <p className="text-[#3a5aa8]">{detail.booking.packageSnapshot.returnFuelRule}</p>
                  </div>
                )}
              </div>

              {/* Price Snapshot & Extend/Cancel Controls */}
              <div className="space-y-3 text-sm">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Snapshot Harga & Aksi Booking
                </h2>
                <div className="rounded-xl bg-[#e6dbc7]/45 p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Sewa {detail.booking.durationHours} jam</span>
                    <span className="font-mono font-semibold">
                      {formatRp(detail.booking.priceSnapshot.baseRentalFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya antar OSRM</span>
                    <span className="font-mono font-semibold">
                      {formatRp(detail.booking.priceSnapshot.deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total sewa</span>
                    <span className="font-mono font-semibold">
                      {formatRp(detail.booking.priceSnapshot.rentalTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>DP dibayar</span>
                    <span className="font-mono font-semibold">
                      {formatRp(detail.booking.priceSnapshot.dpAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sisa pelunasan saat serah-terima</span>
                    <span className="font-mono font-semibold">
                      {formatRp(detail.booking.priceSnapshot.remainingAtHandover)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#062b8a]/15">
                    <span>Deposit escrow ditahan</span>
                    <span className="font-mono font-semibold">
                      {formatRp(detail.booking.priceSnapshot.depositAmount)}
                    </span>
                  </div>
                </div>

                {/* Extend & Cancel (FR-REN-07 / FR-REN-13) — 1 Single Line */}
                {detail.booking.status !== 'CANCELLED' &&
                  detail.booking.status !== 'COMPLETED' && (
                    <div className="flex flex-nowrap items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
                      {([12, 24] as DurationHours[])
                        .filter((d) => d > detail.booking.durationHours)
                        .map((target) => (
                          <button
                            key={target}
                            type="button"
                            onClick={() => handleExtend(target)}
                            className="px-3.5 py-2 rounded-lg bg-[#062b8a] text-[#e6dbc7] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Ajukan Extend ke {target} Jam
                          </button>
                        ))}
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-3.5 py-2 rounded-lg border border-red-700 text-red-700 text-xs font-semibold hover:bg-red-50 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Batalkan Booking (Hitung Refund)
                      </button>
                    </div>
                  )}

                {detail.booking.gpsConsentAccepted && (
                  <p className="text-[11px] text-[#3a5aa8] flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    Persetujuan GPS Traccar tercatat — pelacakan aktif selama masa sewa saja.
                  </p>
                )}
              </div>
            </div>

            {/* Joint Handover Checklist (FR-REN-08 & FR-MIT-06) */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Riwayat Checklist Serah-Terima
                </h2>
                {detail.booking.checklists.length === 0 ? (
                  <p className="text-xs text-[#3a5aa8]">
                    Belum ada checklist yang dicatat untuk booking ini.
                  </p>
                ) : (
                  detail.booking.checklists.map((chk) => (
                    <div
                      key={chk.id}
                      className="rounded-xl border border-[#062b8a]/25 bg-white p-4 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>Tahap: {chk.stage === 'PICKUP' ? 'SERAH UNIT' : 'PENGEMBALIAN'}</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {chk.locked ? 'Terkunci Permanen (2 Pihak)' : 'Menunggu Pihak Kedua'}
                        </span>
                      </div>
                      <p className="font-mono">
                        Odometer: <strong>{chk.odometerKm.toLocaleString('id-ID')} km</strong> •
                        Indikator BBM: <strong>{chk.fuelLevelPct}%</strong> • Foto: {chk.photosCount} berkas
                      </p>
                      <p className="text-[#3a5aa8]">{chk.notes}</p>
                      <p className="text-[11px] text-[#3a5aa8] font-mono">
                        Watermark server: {new Date(chk.watermarkTimestamp).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleChecklist} className="lg:col-span-6 rounded-xl bg-[#e6dbc7]/45 p-5 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Konfirmasi Checklist Bersama (HP Penyewa / Mitra)
                </h3>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Tahap</label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value as 'PICKUP' | 'RETURN')}
                      className="w-full px-2.5 py-2 rounded-lg bg-white border border-[#062b8a]/25"
                    >
                      <option value="PICKUP">Serah Unit (Pickup)</option>
                      <option value="RETURN">Pengembalian (Return)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Konfirmasi Sebagai</label>
                    <select
                      value={actor}
                      onChange={(e) => setActor(e.target.value as 'RENTER' | 'PARTNER')}
                      className="w-full px-2.5 py-2 rounded-lg bg-white border border-[#062b8a]/25"
                    >
                      <option value="RENTER">Penyewa (Renter)</option>
                      <option value="PARTNER">Mitra / Sopir</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Odometer (km)</label>
                    <input
                      type="number"
                      value={odometerKm}
                      onChange={(e) => setOdometerKm(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-lg bg-white border border-[#062b8a]/25 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Indikator BBM (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={fuelPct}
                      onChange={(e) => setFuelPct(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-lg bg-white border border-[#062b8a]/25 font-mono"
                    />
                  </div>
                </div>
                <div className="text-xs">
                  <label className="block font-semibold mb-1">Catatan Kondisi & Kelengkapan</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-white border border-[#062b8a]/25"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-[#062b8a] text-[#e6dbc7] text-xs font-semibold cursor-pointer"
                >
                  Simpan & Konfirmasi Checklist
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
