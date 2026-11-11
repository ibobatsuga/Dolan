'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Fuel,
  Navigation,
  ShieldAlert,
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
    <div className="min-h-screen flex flex-col bg-[#F7F7F8] text-[#0D0D0D]">
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-5 pb-24 md:pb-12">
        <div className="flex items-center justify-between gap-3 flex-nowrap">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D0D0D] hover:text-[#FF5500] whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Muvo
          </Link>
          <div className="flex gap-2 text-xs shrink-0">
            <Link
              href="/booking/MVO-DIY-2601"
              className="px-3 py-1.5 rounded-full bg-white border border-black/15 hover:border-[#FF5500] font-mono font-bold whitespace-nowrap"
            >
              MVO-DIY-2601
            </Link>
            <Link
              href="/booking/MVO-DIY-2602"
              className="px-3 py-1.5 rounded-full bg-white border border-black/15 hover:border-[#FF5500] font-mono font-bold whitespace-nowrap"
            >
              MVO-DIY-2602
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="h-96 rounded-3xl bg-white animate-pulse border border-black/10" />
        ) : !detail ? (
          <div className="rounded-3xl bg-white border border-black/10 p-8 text-center">
            <h1 className="text-2xl font-extrabold mb-2">Voucher {code} tidak ditemukan</h1>
            <p className="text-sm text-[#6B7280]">
              Pilih voucher sampel di atas atau buat booking baru dari beranda Muvo.
            </p>
          </div>
        ) : (
          <div className="voucher-ticket rounded-3xl border border-black/10 overflow-hidden shadow-sm">
            {/* Voucher Header */}
            <div className="p-6 sm:p-8 bg-[#0D0D0D] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#FF5500] font-bold">
                  E-Voucher Resmi Muvo • {detail.province.name}
                </span>
                <h1 className="text-3xl font-extrabold font-mono tracking-tight mt-1">
                  {detail.booking.code}
                </h1>
                <p className="text-sm text-white/80 mt-1">
                  {detail.vehicle.brandModel} ({detail.vehicle.plateMasked}) •{' '}
                  {detail.partner.businessName}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#FF5500] text-white text-xs font-extrabold whitespace-nowrap">
                  STATUS: {detail.booking.status}
                </span>
                <p className="text-xs mt-2 text-white/60 font-mono">
                  Kebijakan: {detail.booking.policyVersion}
                </p>
              </div>
            </div>

            {actionMsg && (
              <div
                className={`mx-6 mt-6 p-3.5 rounded-2xl text-xs font-bold border ${
                  actionMsg.type === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {actionMsg.text}
              </div>
            )}

            {/* Trip Timing & Price Snapshot */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 voucher-perforated">
              <div className="space-y-3 text-sm">
                <h2 className="text-base font-extrabold flex items-center gap-2 text-[#0D0D0D]">
                  <Calendar className="w-4 h-4 text-[#FF5500]" /> Detail Jemput & Durasi
                </h2>
                <div className="rounded-2xl bg-[#F7F7F8] border border-black/5 p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-[#6B7280]">Penyewa</span>
                    <span className="font-bold text-[#0D0D0D]">
                      {detail.booking.renterName} ({detail.booking.renterPhone})
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#6B7280]">Titik Ambil</span>
                    <span className="font-bold text-[#0D0D0D]">
                      {detail.booking.pickupLocationName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#6B7280]">Durasi & Mode</span>
                    <span className="font-bold text-[#0D0D0D]">
                      {detail.booking.durationHours} Jam •{' '}
                      {detail.booking.packageType === 'FULL_BBM_DRIVER'
                        ? 'Full BBM + Sopir'
                        : detail.booking.mode === 'DENGAN_SOPIR'
                          ? 'Dengan Sopir'
                          : 'Lepas Kunci'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#6B7280]">Jadwal</span>
                    <span className="font-mono font-bold text-[#0D0D0D]">
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
                  <div className="flex justify-between gap-2">
                    <span className="text-[#6B7280]">Rute OSRM</span>
                    <span className="font-mono font-semibold text-[#0D0D0D]">
                      {detail.booking.routeQuote.distanceKm} km (~
                      {detail.booking.routeQuote.durationMinutes} mnt)
                    </span>
                  </div>
                  {detail.driver && (
                    <div className="flex justify-between pt-2 border-t border-black/10">
                      <span className="text-[#6B7280]">Sopir Bertugas</span>
                      <span className="font-bold text-[#FF5500]">
                        {detail.driver.name} ({detail.driver.phone})
                      </span>
                    </div>
                  )}
                </div>

                {detail.booking.packageSnapshot && (
                  <div className="rounded-2xl bg-[#FFF2EB] border border-[#FF5500]/25 p-4 text-xs space-y-1">
                    <div className="font-extrabold text-[#FF5500] flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5" /> Batas Paket Full BBM + Sopir
                    </div>
                    <p className="font-semibold text-[#0D0D0D]">
                      Wilayah: {detail.booking.packageSnapshot.wilayah}
                    </p>
                    <p className="text-[#6B7280]">
                      Batas Jarak: {detail.booking.packageSnapshot.maxKm} km •{' '}
                      {detail.booking.packageSnapshot.returnFuelRule}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <h2 className="text-base font-extrabold flex items-center gap-2 text-[#0D0D0D]">
                  <Clock className="w-4 h-4 text-[#FF5500]" /> Rincian Tarif & Aksi
                </h2>
                <div className="rounded-2xl bg-[#F7F7F8] border border-black/5 p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Sewa {detail.booking.durationHours} jam</span>
                    <span className="font-mono font-bold">
                      {formatRp(detail.booking.priceSnapshot.baseRentalFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Ongkos antar OSRM</span>
                    <span className="font-mono font-bold">
                      {formatRp(detail.booking.priceSnapshot.deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Total sewa final</span>
                    <span className="font-mono font-extrabold text-[#0D0D0D]">
                      {formatRp(detail.booking.priceSnapshot.rentalTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">DP dibayar</span>
                    <span className="font-mono font-extrabold text-[#FF5500]">
                      {formatRp(detail.booking.priceSnapshot.dpAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Sisa saat serah-terima</span>
                    <span className="font-mono font-bold">
                      {formatRp(detail.booking.priceSnapshot.remainingAtHandover)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-black/10">
                    <span className="text-[#6B7280]">Escrow Deposit</span>
                    <span className="font-mono font-bold">
                      {formatRp(detail.booking.priceSnapshot.depositAmount)}
                    </span>
                  </div>
                </div>

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
                            className="px-4 py-2 rounded-full bg-[#0D0D0D] hover:bg-[#FF5500] text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                          >
                            Extend ke {target} Jam
                          </button>
                        ))}
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 rounded-full border border-red-300 text-red-700 text-xs font-bold hover:bg-red-50 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Batalkan Booking
                      </button>
                    </div>
                  )}

                {detail.booking.gpsConsentAccepted && (
                  <p className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#FF5500]" />
                    Persetujuan GPS keamanan tercatat aktif selama masa sewa.
                  </p>
                )}
              </div>
            </div>

            {/* Joint Handover Checklist */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white">
              <div className="lg:col-span-6 space-y-3">
                <h2 className="text-base font-extrabold flex items-center gap-2 text-[#0D0D0D]">
                  <Camera className="w-4 h-4 text-[#FF5500]" /> Riwayat Checklist Serah-Terima
                </h2>
                {detail.booking.checklists.length === 0 ? (
                  <p className="text-xs text-[#6B7280]">
                    Belum ada checklist yang dicatat untuk booking ini.
                  </p>
                ) : (
                  detail.booking.checklists.map((chk) => (
                    <div
                      key={chk.id}
                      className="rounded-2xl border border-black/10 bg-[#F7F7F8] p-4 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{chk.stage === 'PICKUP' ? 'SERAH UNIT' : 'PENGEMBALIAN'}</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {chk.locked ? 'Terkunci (2 Pihak)' : 'Menunggu Konfirmasi'}
                        </span>
                      </div>
                      <p className="font-mono text-[#0D0D0D]">
                        Odometer: <strong>{chk.odometerKm.toLocaleString('id-ID')} km</strong> •
                        BBM: <strong>{chk.fuelLevelPct}%</strong> • Foto: {chk.photosCount}
                      </p>
                      <p className="text-[#6B7280]">{chk.notes}</p>
                      <p className="text-[11px] text-[#6B7280] font-mono">
                        Watermark: {new Date(chk.watermarkTimestamp).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleChecklist}
                className="lg:col-span-6 rounded-2xl bg-[#F7F7F8] border border-black/10 p-5 space-y-3"
              >
                <h3 className="text-sm font-extrabold flex items-center gap-1.5 text-[#0D0D0D]">
                  <ShieldAlert className="w-4 h-4 text-[#FF5500]" /> Konfirmasi Checklist Bersama
                </h3>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block font-bold mb-1">Tahap</label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value as 'PICKUP' | 'RETURN')}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 font-semibold"
                    >
                      <option value="PICKUP">Serah Unit (Pickup)</option>
                      <option value="RETURN">Pengembalian (Return)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Konfirmasi Sebagai</label>
                    <select
                      value={actor}
                      onChange={(e) => setActor(e.target.value as 'RENTER' | 'PARTNER')}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 font-semibold"
                    >
                      <option value="RENTER">Penyewa (Renter)</option>
                      <option value="PARTNER">Mitra / Sopir</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block font-bold mb-1">Odometer (km)</label>
                    <input
                      type="number"
                      value={odometerKm}
                      onChange={(e) => setOdometerKm(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Indikator BBM (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={fuelPct}
                      onChange={(e) => setFuelPct(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 font-mono"
                    />
                  </div>
                </div>
                <div className="text-xs">
                  <label className="block font-bold mb-1">Catatan Kondisi Unit</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-black/10"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#0D0D0D] hover:bg-[#FF5500] text-white text-xs font-extrabold cursor-pointer transition-colors"
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
