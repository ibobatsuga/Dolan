'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  Lock,
  MapPin,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import { Booking, DurationHours, OcrVerificationResult, PackageType, RentalMode } from '@/lib/types';
import { formatRp, MarketplaceSearchItem, UserAccount } from './types';

interface BookingFlowModalProps {
  item: MarketplaceSearchItem | null;
  onClose: () => void;
  provinceId: string;
  pickupPointId: string;
  initialStartDate: string;
  initialStartTime: string;
  duration: DurationHours;
  mode: RentalMode;
  packageType: PackageType;
  account: UserAccount;
  onBookingCreated: (booking: Booking) => void;
}

const TIME_SLOTS = ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

export function BookingFlowModal({
  item,
  onClose,
  provinceId,
  pickupPointId,
  initialStartDate,
  initialStartTime,
  duration,
  mode,
  packageType,
  account,
  onBookingCreated,
}: BookingFlowModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [startTime, setStartTime] = useState(
    TIME_SLOTS.includes(initialStartTime) ? initialStartTime : '09:00'
  );
  const [renterName, setRenterName] = useState(account.name || 'Nadia Kusuma');
  const [renterPhone, setRenterPhone] = useState(account.phone || '081299887766');
  const [renterEmail, setRenterEmail] = useState(account.email || 'nadia.kusuma@muvo.id');
  const [notes, setNotes] = useState('');

  // OCR + GPS
  const [docNumber, setDocNumber] = useState('3404072204960004');
  const [docExpiry, setDocExpiry] = useState('2029-04-22');
  const [ocrResult, setOcrResult] = useState<OcrVerificationResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [gpsConsent, setGpsConsent] = useState(true);

  // Payment method (Batch 3 Sheet 2)
  const [payMethod, setPayMethod] = useState<'QRIS' | 'VA' | 'EWALLET' | 'CARD'>('QRIS');
  const [gateway, setGateway] = useState<'MIDTRANS' | 'XENDIT'>('MIDTRANS');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  if (!item) return null;

  const { vehicle, partner, price, routeQuote } = item;

  const handleRunOcr = async () => {
    setOcrLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: renterName,
          docType: mode === 'LEPAS_KUNCI' ? 'SIM_A' : 'KTP',
          claimedNumber: docNumber,
          claimedExpiry: docExpiry,
        }),
      });
      const json = (await res.json()) as { result: OcrVerificationResult };
      setOcrResult(json.result);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const startAtIso = new Date(`${startDate}T${startTime}:00+07:00`).toISOString();
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          provinceId,
          renterName,
          renterPhone,
          renterEmail,
          durationHours: duration,
          startAtIso,
          mode,
          packageType,
          pickupPointId,
          gpsConsentAccepted: gpsConsent,
          gateway,
          idempotencyKey: `muvo-${vehicle.id}-${Date.now()}`,
        }),
      });
      const json = (await res.json()) as { ok: boolean; booking?: Booking; error?: string };
      if (!res.ok || !json.ok || !json.booking) {
        setErrorMsg(json.error || 'Jadwal bentrok atau gagal memproses booking.');
        return;
      }
      setCreatedBooking(json.booking);
      onBookingCreated(json.booking);
      setStep(3);
    } catch {
      setErrorMsg('Gagal terhubung ke server pembayaran Muvo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden border border-black/10 shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-[#6B7280] hover:text-[#0D0D0D] cursor-pointer"
              >
                ← Ubah Jadwal
              </button>
            )}
            <span className="text-sm font-extrabold text-[#0D0D0D]">
              {step === 1 && 'Atur Jadwal & Data Penyewa'}
              {step === 2 && 'Ringkasan Biaya & Pembayaran'}
              {step === 3 && 'Booking & Pembayaran Sukses!'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Booking"
            className="w-8 h-8 rounded-full bg-[#F7F7F8] flex items-center justify-center hover:bg-black/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-5 pt-3 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                step >= s ? 'bg-[#FF5500]' : 'bg-black/10'
              }`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Compact Car Card */}
          {step !== 3 && (
            <div className="rounded-2xl bg-[#F7F7F8] border border-black/5 p-3 flex items-center gap-3">
              <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-white shrink-0">
                <Image src={vehicle.photo} alt={vehicle.brandModel} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-[#0D0D0D] truncate">
                  {vehicle.brandModel}
                </p>
                <p className="text-[11px] text-[#6B7280] truncate">
                  {partner.businessName} • {duration} Jam •{' '}
                  {packageType === 'FULL_BBM_DRIVER'
                    ? 'Full BBM + Sopir'
                    : mode === 'DENGAN_SOPIR'
                      ? 'Dengan Sopir'
                      : 'Lepas Kunci'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-extrabold text-[#FF5500] tabular-nums">
                  {price ? formatRp(price.rentalTotal) : '-'}
                </p>
                <p className="text-[10px] text-[#6B7280]">Total Final</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {/* Date & Flexible Start Time Slots (Batch 2 Sheet 1) */}
              <div className="rounded-2xl border border-black/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#0D0D0D] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#FF5500]" />
                    Pilih Tanggal & Jam Ambil
                  </span>
                  <span className="text-[11px] font-semibold text-[#6B7280]">WIB</span>
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 rounded-xl bg-[#F7F7F8] border border-black/10 px-3 text-xs font-bold text-[#0D0D0D] focus:outline-none"
                />
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-nowrap pb-1">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setStartTime(slot)}
                      className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                        startTime === slot
                          ? 'bg-[#0D0D0D] text-white'
                          : 'bg-[#F7F7F8] text-[#0D0D0D] border border-black/10'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#6B7280] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5500]" />
                  Titik serah-terima: <strong className="text-[#0D0D0D]">{routeQuote.destinationName}</strong>
                </p>
              </div>

              {/* Renter Details */}
              <div className="rounded-2xl border border-black/10 p-4 space-y-2.5">
                <p className="text-xs font-extrabold text-[#0D0D0D]">Data Penyewa</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Nama Sesuai KTP"
                    value={renterName}
                    onChange={(e) => setRenterName(e.target.value)}
                    className="h-10 rounded-xl bg-[#F7F7F8] border border-black/10 px-3 text-xs font-semibold focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Nomor WhatsApp"
                    value={renterPhone}
                    onChange={(e) => setRenterPhone(e.target.value)}
                    className="h-10 rounded-xl bg-[#F7F7F8] border border-black/10 px-3 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email Voucher"
                  value={renterEmail}
                  onChange={(e) => setRenterEmail(e.target.value)}
                  className="w-full h-10 rounded-xl bg-[#F7F7F8] border border-black/10 px-3 text-xs font-semibold focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Catatan tambahan (misal: nomor penerbangan YIA / kursi bayi)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-10 rounded-xl bg-[#F7F7F8] border border-black/10 px-3 text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* OCR Pre-Check & GPS Consent */}
              <div className="rounded-2xl bg-[#F7F7F8] border border-black/10 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#0D0D0D] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#FF5500]" />
                    Pre-Check {mode === 'LEPAS_KUNCI' ? 'SIM A & KTP' : 'Identitas'} (OCR)
                  </span>
                  <button
                    type="button"
                    onClick={handleRunOcr}
                    disabled={ocrLoading}
                    className="px-3 py-1.5 rounded-full bg-[#0D0D0D] hover:bg-[#FF5500] text-white text-[11px] font-bold whitespace-nowrap cursor-pointer"
                  >
                    {ocrLoading ? 'Memindai...' : 'Verifikasi Instan'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="h-9 rounded-xl bg-white border border-black/10 px-3 text-xs font-mono"
                    placeholder="NIK / No. SIM A"
                  />
                  <input
                    type="date"
                    value={docExpiry}
                    onChange={(e) => setDocExpiry(e.target.value)}
                    className="h-9 rounded-xl bg-white border border-black/10 px-3 text-xs font-mono"
                  />
                </div>
                {ocrResult && (
                  <p className="text-[11px] font-bold text-emerald-700">
                    ✓ OCR Terverifikasi ({Math.round(ocrResult.confidence * 100)}%) •{' '}
                    {ocrResult.maskedNumber}
                  </p>
                )}

                {mode === 'LEPAS_KUNCI' && (
                  <label className="flex items-start gap-2 pt-1 text-[11px] text-[#6B7280] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gpsConsent}
                      onChange={(e) => setGpsConsent(e.target.checked)}
                      className="mt-0.5 accent-[#FF5500]"
                    />
                    <span>
                      Saya menyetujui aktivasi perangkat GPS keamanan selama masa sewa lepas kunci
                      di wilayah DI Yogyakarta.
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {step === 2 && price && (
            <div className="space-y-4">
              {/* Price Breakdown (Batch 3 Sheet 2) */}
              <div className="rounded-2xl border border-black/10 p-4 space-y-2.5 text-xs">
                <h4 className="text-sm font-extrabold text-[#0D0D0D]">Rincian Harga Transparan</h4>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Tarif Unit ({duration} Jam)</span>
                  <span className="font-bold text-[#0D0D0D] tabular-nums">
                    {formatRp(price.baseRentalFee)}
                  </span>
                </div>
                {price.seasonalSurcharge > 0 && (
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Musim Libur ({price.seasonalLabel})</span>
                    <span className="font-bold text-[#0D0D0D] tabular-nums">
                      {formatRp(price.seasonalSurcharge)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B7280]">
                  <span>Antar-Jemput ({routeQuote.destinationName})</span>
                  <span className="font-bold text-[#0D0D0D] tabular-nums">
                    {price.deliveryFee === 0 ? 'GRATIS' : formatRp(price.deliveryFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-black/10 flex justify-between text-sm font-extrabold text-[#0D0D0D]">
                  <span>Total Biaya Sewa</span>
                  <span className="tabular-nums">{formatRp(price.rentalTotal)}</span>
                </div>
                <div className="rounded-xl bg-[#FFF2EB] border border-[#FF5500]/25 p-3 space-y-1">
                  <div className="flex justify-between font-bold text-[#0D0D0D]">
                    <span>DP 30% Dibayar Sekarang</span>
                    <span className="text-[#FF5500] tabular-nums">{formatRp(price.dpAmount)}</span>
                  </div>
                  {price.depositAmount > 0 && (
                    <div className="flex justify-between text-[11px] text-[#6B7280]">
                      <span>Escrow Deposit (Dikembalikan utuh)</span>
                      <span className="font-bold tabular-nums">
                        {formatRp(price.depositAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-[#6B7280]">
                    <span>Pelunasan Saat Serah-Terima</span>
                    <span className="font-bold tabular-nums">
                      {formatRp(price.remainingAtHandover)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Cards (Batch 3 Sheet 2) */}
              <div className="space-y-2">
                <p className="text-xs font-extrabold text-[#0D0D0D]">Pilih Metode Pembayaran</p>
                {[
                  {
                    id: 'QRIS' as const,
                    gw: 'MIDTRANS' as const,
                    title: 'QRIS Instan (Semua E-Wallet & Mobile Banking)',
                    sub: 'Verifikasi otomatis dalam < 5 detik',
                  },
                  {
                    id: 'VA' as const,
                    gw: 'XENDIT' as const,
                    title: 'Virtual Account Bank (BCA, Mandiri, BNI, BRI)',
                    sub: 'Tanpa biaya admin tambahan',
                  },
                  {
                    id: 'EWALLET' as const,
                    gw: 'MIDTRANS' as const,
                    title: 'GoPay / OVO / DANA / ShopeePay',
                    sub: 'Bayar langsung dari aplikasi e-wallet',
                  },
                  {
                    id: 'CARD' as const,
                    gw: 'XENDIT' as const,
                    title: 'Kartu Kredit / Debit (Visa, Mastercard, JCB)',
                    sub: 'Diamankan enkripsi 3D Secure',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setPayMethod(opt.id);
                      setGateway(opt.gw);
                    }}
                    className={`w-full rounded-2xl p-3.5 border text-left flex items-center justify-between gap-3 cursor-pointer ${
                      payMethod === opt.id
                        ? 'border-[#FF5500] bg-[#FFF2EB]/50'
                        : 'border-black/10 bg-white hover:bg-[#F7F7F8]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          payMethod === opt.id ? 'border-[#FF5500]' : 'border-black/30'
                        }`}
                      >
                        {payMethod === opt.id && (
                          <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
                        )}
                      </span>
                      <div>
                        <p className="text-xs font-extrabold text-[#0D0D0D]">{opt.title}</p>
                        <p className="text-[11px] text-[#6B7280]">{opt.sub}</p>
                      </div>
                    </div>
                    {opt.id === 'CARD' ? (
                      <CreditCard className="w-4 h-4 text-[#0D0D0D]/60 shrink-0" />
                    ) : (
                      <Wallet className="w-4 h-4 text-[#FF5500] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && createdBooking && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#0D0D0D]">Booking & DP Terkonfirmasi!</h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Voucher resmi Muvo telah dikirim ke WhatsApp ({createdBooking.renterPhone}) dan
                  email.
                </p>
              </div>

              <div className="rounded-2xl bg-[#F7F7F8] border border-black/10 p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Kode Voucher</span>
                  <span className="font-mono font-extrabold text-[#FF5500]">
                    {createdBooking.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Unit Mobil</span>
                  <span className="font-bold text-[#0D0D0D]">{vehicle.brandModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Jadwal & Durasi</span>
                  <span className="font-bold text-[#0D0D0D]">
                    {startDate}, {startTime} WIB ({duration} Jam)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Titik Ambil</span>
                  <span className="font-bold text-[#0D0D0D]">{createdBooking.pickupLocationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Dibayar Sekarang</span>
                  <span className="font-extrabold text-[#0D0D0D] tabular-nums">
                    {formatRp(createdBooking.priceSnapshot.totalDueNow)} ({payMethod})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <Link
                  href={`/booking/${createdBooking.code}`}
                  className="h-11 rounded-full bg-[#0D0D0D] hover:bg-[#FF5500] text-white text-xs font-bold flex items-center justify-center whitespace-nowrap transition-colors"
                >
                  Buka E-Voucher Lengkap
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 rounded-full border border-black/15 bg-white hover:bg-[#F7F7F8] text-xs font-bold text-[#0D0D0D] cursor-pointer whitespace-nowrap"
                >
                  Lihat Booking Saya
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Sticky Footer Action */}
        {step !== 3 && (
          <div className="p-4 border-t border-black/10 bg-white">
            {step === 1 ? (
              <button
                type="button"
                disabled={mode === 'LEPAS_KUNCI' && !gpsConsent}
                onClick={() => setStep(2)}
                className="w-full h-12 rounded-full bg-[#0D0D0D] hover:bg-[#1a1a1a] disabled:opacity-40 text-white text-sm font-bold flex items-center justify-between px-5 cursor-pointer"
              >
                <span>Lanjut ke Pembayaran</span>
                <span className="w-8 h-8 rounded-full bg-[#FF5500] text-white flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || !price}
                onClick={handleConfirmBooking}
                className="w-full h-12 rounded-full bg-[#0D0D0D] hover:bg-[#1a1a1a] disabled:opacity-40 text-white text-sm font-bold flex items-center justify-between px-5 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#FF5500]" />
                  <span>
                    {submitting
                      ? 'Memproses Pembayaran...'
                      : `Bayar Sekarang ${price ? formatRp(price.totalDueNow) : ''}`}
                  </span>
                </span>
                <span className="w-8 h-8 rounded-full bg-[#FF5500] text-white flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
