'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  ShieldCheck,
  Fuel,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  ScanText,
  ArrowRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import {
  DurationHours,
  OcrVerificationResult,
  PackageType,
  PartnerProfile,
  PickupPoint,
  PriceBreakdown,
  Province,
  RentalMode,
  RouteQuote,
  VehicleListing,
} from '@/lib/types';

interface SearchResultItem {
  vehicle: VehicleListing;
  partner: PartnerProfile;
  hubName: string;
  routeQuote: RouteQuote;
  price: PriceBreakdown | null;
  rateAvailable: boolean;
  calendarAvailable: boolean;
  conflictReason?: string;
  endAt: string;
  bufferEndAt: string;
  alternativeOptions: Array<{
    durationHours: DurationHours;
    mode: RentalMode;
    packageType: PackageType;
    baseRate: number;
  }>;
}

interface SearchApiResponse {
  province: Province;
  pickup: PickupPoint;
  items: SearchResultItem[];
  provinces: Province[];
  pickupPoints: PickupPoint[];
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function MarketplaceHome({ initialProvince = 'jogja', initialLang = 'id' }: { initialProvince?: string; initialLang?: 'id' | 'en' }) {
  const router = useRouter();
  const [lang, setLang] = useState<'id' | 'en'>(initialLang);
  const [provinceSlug, setProvinceSlug] = useState(initialProvince);

  // Default pickup tomorrow at 09:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().slice(0, 10);

  const [pickupDate, setPickupDate] = useState(defaultDate);
  const [pickupTime, setPickupTime] = useState('09:00');
  const [durationHours, setDurationHours] = useState<DurationHours>(12);
  const [mode, setMode] = useState<RentalMode>('LEPAS_KUNCI');
  const [packageType, setPackageType] = useState<PackageType>('UNIT_ONLY');
  const [pickupPointId, setPickupPointId] = useState('pp-diy-yia');

  // Filters
  const [transmission, setTransmission] = useState<'ALL' | 'MATIC' | 'MANUAL'>('ALL');
  const [minSeats, setMinSeats] = useState<number>(0);
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);

  const [data, setData] = useState<SearchApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Checkout Modal State
  const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(null);
  const [renterName, setRenterName] = useState('Raka Pratama');
  const [renterPhone, setRenterPhone] = useState('+6281226008899');
  const [renterEmail, setRenterEmail] = useState('raka.pratama@example.com');
  const [ktpNumber, setKtpNumber] = useState('3471041205950002');
  const [simNumber, setSimNumber] = useState('950512340011');
  const [simExpiry, setSimExpiry] = useState('2029-05-12');
  const [simulateBlurOcr, setSimulateBlurOcr] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrVerificationResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [gpsConsent, setGpsConsent] = useState(true);
  const [gateway, setGateway] = useState<'MIDTRANS' | 'XENDIT'>('MIDTRANS');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const startIso = new Date(`${pickupDate}T${pickupTime}:00`).toISOString();
      const qs = new URLSearchParams({
        province: provinceSlug,
        startAt: startIso,
        duration: String(durationHours),
        mode,
        package: packageType,
        pickupPointId,
        transmission,
        minSeats: String(minSeats),
        freeDeliveryOnly: String(freeDeliveryOnly),
      });
      const res = await fetch(`/api/search?${qs.toString()}`);
      const json = (await res.json()) as SearchApiResponse;
      if (cancelled) return;
      setData(json);
      if (json.pickupPoints.length > 0 && !json.pickupPoints.some((p) => p.id === pickupPointId)) {
        setPickupPointId(json.pickupPoints[0].id);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    provinceSlug,
    pickupDate,
    pickupTime,
    durationHours,
    mode,
    packageType,
    pickupPointId,
    transmission,
    minSeats,
    freeDeliveryOnly,
  ]);

  const handleModePackageSelect = (newMode: RentalMode, newPkg: PackageType) => {
    setMode(newMode);
    setPackageType(newPkg);
  };

  const handleRunOcr = async () => {
    setOcrLoading(true);
    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: renterName,
          docType: 'SIM_A',
          claimedNumber: simNumber,
          claimedExpiry: simExpiry,
          simulateBlur: simulateBlurOcr,
        }),
      });
      const json = (await res.json()) as { result: OcrVerificationResult };
      setOcrResult(json.result);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setCheckoutSubmitting(true);
    setCheckoutError(null);

    try {
      const startIso = new Date(`${pickupDate}T${pickupTime}:00`).toISOString();
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedItem.vehicle.id,
          provinceId: selectedItem.vehicle.provinceId,
          renterName,
          renterPhone,
          renterEmail,
          durationHours,
          startAtIso: startIso,
          mode,
          packageType,
          pickupPointId,
          gpsConsentAccepted: mode === 'LEPAS_KUNCI' ? gpsConsent : true,
          gateway,
          idempotencyKey: `${selectedItem.vehicle.id}-${pickupDate}-${pickupTime}-${durationHours}`,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        booking?: { code: string };
      };
      if (!res.ok || !json.ok || !json.booking) {
        setCheckoutError(json.error || 'Booking gagal diproses.');
        return;
      }
      router.push(`/booking/${json.booking.code}`);
    } catch {
      setCheckoutError('Terjadi kendala jaringan saat memproses booking.');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const endDisplay = (() => {
    const start = new Date(`${pickupDate}T${pickupTime}:00`);
    const end = new Date(start.getTime() + durationHours * 3600 * 1000);
    return end.toLocaleString(lang === 'en' ? 'en-GB' : 'id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  })();

  const t = {
    h1:
      lang === 'en'
        ? 'Jogja car rental, fixed final price.'
        : 'Sewa mobil Jogja, harga final pasti.',
    sub:
      lang === 'en'
        ? 'Compare verified Yogyakarta rentals with live calendar locks, 6/12/24h flexible start times, OSRM delivery fees, and optional Full Fuel + Driver packages.'
        : 'Bandingkan unit rental lokal terverifikasi di DIY dengan kalender anti-double-book, durasi fleksibel 6/12/24 jam, ongkos antar OSRM, dan paket Full BBM + Sopir.',
    searchBtn: lang === 'en' ? 'Check Availability' : 'Cek Ketersediaan',
    bookBtn: lang === 'en' ? 'Book with Fixed DP' : 'Booking & Bayar DP',
  };

  const activeProvince = data?.province;

  return (
    <div className="min-h-screen flex flex-col bg-[#e6dbc7] text-[#062b8a]">
      <Navbar
        lang={lang}
        onLangChange={setLang}
        activeProvinceSlug={provinceSlug}
        onProvinceChange={setProvinceSlug}
      />

      {/* HERO SECTION: Voucher Artefact + Real Jogja Photography */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-8 pb-10">
        <div className="voucher-ticket rounded-2xl overflow-hidden border-2 border-[#062b8a]">
          {/* Top Hero Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-[#faf7f0]">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#062b8a] text-[#e6dbc7] text-xs font-semibold">
                    <MapPin className="w-3.5 h-3.5" />
                    {activeProvince?.name || 'DI Yogyakarta'} ({activeProvince?.code || 'DIY'})
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e6dbc7] text-[#062b8a] text-xs font-medium">
                    Multi-Province Engine Ready
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] leading-[1.02] text-[#062b8a] max-w-[18ch] mb-4">
                  {t.h1}
                </h1>
                <p className="text-base sm:text-lg text-[#062b8a]/85 leading-relaxed max-w-xl">
                  {t.sub}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-dotted border-[#062b8a]/30 grid grid-cols-3 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="block font-semibold text-[#062b8a]">6 / 12 / 24 Jam</span>
                  <span className="text-[#3a5aa8]">Jam mulai fleksibel</span>
                </div>
                <div>
                  <span className="block font-semibold text-[#062b8a]">OSRM + Traccar</span>
                  <span className="text-[#3a5aa8]">Rute jalan & GPS aman</span>
                </div>
                <div>
                  <span className="block font-semibold text-[#062b8a]">Tesseract OCR</span>
                  <span className="text-[#3a5aa8]">Verifikasi sekali pakai</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-[340px] bg-[#062b8a]">
              <img
                src="/images/hero-jogja.jpg"
                alt="Armada MPV di jalur wisata Yogyakarta berlatar Gunung Merapi"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-[#062b8a]/90 text-[#e6dbc7] px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between">
                <span>Pilot Koridor: YIA • Stasiun Tugu • Malioboro • Sleman</span>
                <span className="font-mono font-semibold">DIY-01</span>
              </div>
            </div>
          </div>

          {/* Perforated Voucher Search Bar */}
          <div className="border-t-4 border-dotted border-[#ddd0b9] bg-[#faf7f0] p-5 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
              {/* Province */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3a5aa8] mb-1.5">
                  {lang === 'en' ? 'Province' : 'Provinsi'}
                </label>
                <select
                  value={provinceSlug}
                  onChange={(e) => setProvinceSlug(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-[#e6dbc7]/50 border border-[#062b8a]/25 text-sm font-medium text-[#062b8a]"
                >
                  <option value="jogja">DI Yogyakarta (Aktif)</option>
                  <option value="jawa-tengah">Jawa Tengah (V2)</option>
                  <option value="jawa-timur">Jawa Timur (V2)</option>
                  <option value="bali">Bali (V2)</option>
                </select>
              </div>

              {/* Pickup Point */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3a5aa8] mb-1.5">
                  {lang === 'en' ? 'Pickup Point' : 'Titik Ambil'}
                </label>
                <select
                  value={pickupPointId}
                  onChange={(e) => setPickupPointId(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-[#e6dbc7]/50 border border-[#062b8a]/25 text-sm font-medium text-[#062b8a]"
                >
                  {(data?.pickupPoints || []).map((pp) => (
                    <option key={pp.id} value={pp.id}>
                      {lang === 'en' ? pp.nameEn : pp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + Flexible Start Time */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3a5aa8] mb-1.5">
                  {lang === 'en' ? 'Start Date' : 'Tanggal Mulai'}
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-[#e6dbc7]/50 border border-[#062b8a]/25 text-sm font-medium text-[#062b8a]"
                />
              </div>

              <div className="lg:col-span-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3a5aa8] mb-1.5">
                  {lang === 'en' ? 'Time' : 'Jam'}
                </label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full h-11 px-2.5 rounded-lg bg-[#e6dbc7]/50 border border-[#062b8a]/25 text-sm font-mono font-medium text-[#062b8a]"
                />
              </div>

              {/* Duration 6 / 12 / 24 */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3a5aa8] mb-1.5">
                  {lang === 'en' ? 'Duration' : 'Durasi'}
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#e6dbc7]/60 p-1 rounded-lg border border-[#062b8a]/20 h-11">
                  {([6, 12, 24] as DurationHours[]).map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setDurationHours(dur)}
                      className={`rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        durationHours === dur
                          ? 'bg-[#062b8a] text-[#e6dbc7]'
                          : 'text-[#062b8a] hover:bg-[#ddd0b9]'
                      }`}
                    >
                      {dur}j
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode & Package */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#3a5aa8] mb-1.5">
                  {lang === 'en' ? 'Mode & Package' : 'Mode & Paket'}
                </label>
                <select
                  value={`${mode}:${packageType}`}
                  onChange={(e) => {
                    const [m, p] = e.target.value.split(':') as [RentalMode, PackageType];
                    handleModePackageSelect(m, p);
                  }}
                  className="w-full h-11 px-3 rounded-lg bg-[#062b8a] text-[#e6dbc7] text-sm font-semibold cursor-pointer"
                >
                  <option value="LEPAS_KUNCI:UNIT_ONLY">
                    {lang === 'en' ? 'Self-Drive (Unit Only)' : 'Lepas Kunci (Unit Saja)'}
                  </option>
                  <option value="DENGAN_SOPIR:WITH_DRIVER">
                    {lang === 'en' ? 'With Driver (No Fuel)' : 'Dengan Sopir (Non-BBM)'}
                  </option>
                  <option value="DENGAN_SOPIR:FULL_BBM_DRIVER">
                    {lang === 'en' ? 'Full Fuel + Driver' : 'Paket Full BBM + Sopir'}
                  </option>
                </select>
              </div>
            </div>

            {/* Calculated Finish Time + Pickup Grace Notice */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#3a5aa8]">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#062b8a]">
                  <Clock className="w-3.5 h-3.5" />
                  Selesai otomatis: <strong className="font-mono">{endDisplay} WIB</strong>
                </span>
                {durationHours === 6 && (
                  <span className="inline-flex items-center gap-1 bg-[#e6dbc7] px-2.5 py-0.5 rounded-full text-[#062b8a] font-medium">
                    +30 mnt paruh jam cuci & cek unit otomatis (FR-MIT-03)
                  </span>
                )}
                {data?.pickup && (
                  <span>
                    Masa tunggu gratis titik jemput: <strong>{data.pickup.freeWaitingMinutes} menit</strong>
                  </span>
                )}
              </div>
              <span className="font-medium">
                {mode === 'LEPAS_KUNCI'
                  ? 'Membutuhkan verifikasi KTP & SIM A + Deposit Escrow'
                  : 'Tanpa SIM penyewa & tanpa deposit lepas kunci'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* EXPANSION PROVINCE NOTICE IF NON-DIY SELECTED */}
      {activeProvince && activeProvince.status !== 'ACTIVE' && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-8">
          <div className="rounded-2xl bg-[#062b8a] text-[#e6dbc7] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#e6dbc7] text-[#062b8a] text-xs font-semibold mb-3">
                Status Wilayah: {activeProvince.status === 'PILOT_READY' ? 'SIAP PILOT V2' : 'INFRASTRUKTUR MULTI-PROVINSI SIAP'}
              </span>
              <h2 className="text-2xl font-semibold mb-2">
                {activeProvince.name} masuk peta ekspansi Dolan berikutnya
              </h2>
              <p className="text-sm text-[#e6dbc7]/85 max-w-2xl">
                Skema database, zona geofence Traccar, konfigurasi tarif regional, dan routing SEO untuk{' '}
                <strong>{activeProvince.popularCorridors.join(', ')}</strong> sudah aktif di backend. Transaksi
                publik saat ini difokuskan di <strong>DI Yogyakarta</strong> sesuai strategi MVP supply-first.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setProvinceSlug('jogja')}
                className="px-4 py-2.5 rounded-lg bg-[#e6dbc7] text-[#062b8a] text-sm font-semibold cursor-pointer"
              >
                Lihat Armada Jogja (Aktif)
              </button>
              <Link
                href="/admin"
                className="px-4 py-2.5 rounded-lg border border-[#e6dbc7]/40 text-sm font-semibold text-center"
              >
                Kelola Provinsi di Admin
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FILTER BAR & RESULTS */}
      {(!activeProvince || activeProvince.status === 'ACTIVE') && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-14">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {lang === 'en'
                  ? 'Verified Yogyakarta Fleet'
                  : 'Armada Terverifikasi di DI Yogyakarta'}
              </h2>
              <p className="text-sm text-[#3a5aa8]">
                Harga tiap durasi ditetapkan mandiri oleh mitra (bukan kelipatan otomatis). Total tampil utuh sebelum checkout.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#3a5aa8] mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
              </span>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as 'ALL' | 'MATIC' | 'MANUAL')}
                className="px-3 py-1.5 rounded-lg bg-[#faf7f0] border border-[#062b8a]/20 text-xs font-semibold"
              >
                <option value="ALL">Semua Transmisi</option>
                <option value="MATIC">Matic / CVT</option>
                <option value="MANUAL">Manual</option>
              </select>
              <select
                value={minSeats}
                onChange={(e) => setMinSeats(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg bg-[#faf7f0] border border-[#062b8a]/20 text-xs font-semibold"
              >
                <option value={0}>Semua Kursi</option>
                <option value={5}>5+ Kursi</option>
                <option value={7}>7+ Kursi (Keluarga)</option>
                <option value={12}>12 Kursi (Hiace)</option>
              </select>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#faf7f0] border border-[#062b8a]/20 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeDeliveryOnly}
                  onChange={(e) => setFreeDeliveryOnly(e.target.checked)}
                />
                Gratis Antar
              </label>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded-2xl bg-[#faf7f0]/70 animate-pulse border border-[#062b8a]/10"
                />
              ))}
            </div>
          ) : data && data.items.length === 0 ? (
            <div className="rounded-2xl bg-[#faf7f0] border-2 border-[#062b8a]/20 p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">
                Tidak ada unit yang sesuai filter saat ini
              </h3>
              <p className="text-sm text-[#3a5aa8] mb-5">
                Coba geser jam mulai, pilih mode dengan sopir, atau reset filter kursi dan transmisi.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTransmission('ALL');
                    setMinSeats(0);
                    setFreeDeliveryOnly(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#062b8a] text-[#e6dbc7] text-sm font-semibold cursor-pointer"
                >
                  Reset Filter
                </button>
                <button
                  type="button"
                  onClick={() => handleModePackageSelect('DENGAN_SOPIR', 'WITH_DRIVER')}
                  className="px-4 py-2 rounded-lg border border-[#062b8a] text-sm font-semibold cursor-pointer"
                >
                  Coba Mode Dengan Sopir
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(data?.items || []).map((item) => {
                const { vehicle, partner, routeQuote, price, rateAvailable, calendarAvailable } = item;
                const canBook = rateAvailable && calendarAvailable && price !== null;

                return (
                  <article
                    key={vehicle.id}
                    className={`rounded-2xl bg-[#faf7f0] border-2 flex flex-col overflow-hidden transition-transform ${
                      canBook
                        ? 'border-[#062b8a]'
                        : 'border-[#062b8a]/25 opacity-90'
                    }`}
                  >
                    {/* Photo */}
                    <div className="relative h-48 bg-[#ddd0b9]">
                      <img
                        src={vehicle.photo}
                        alt={vehicle.brandModel}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded-md bg-[#062b8a] text-[#e6dbc7] text-[11px] font-semibold">
                          {vehicle.transmission} • {vehicle.seats} Kursi
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-[#faf7f0]/95 text-[#062b8a] text-[11px] font-semibold">
                          {vehicle.year} • {vehicle.fuelType}
                        </span>
                      </div>
                      {vehicle.hasGpsTracker && (
                        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#faf7f0]/95 text-[#062b8a] text-[11px] font-semibold">
                          <Navigation className="w-3 h-3" /> GPS Traccar
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-lg font-semibold leading-snug">
                            {vehicle.brandModel}
                          </h3>
                          <span className="text-xs font-mono text-[#3a5aa8] shrink-0">
                            {vehicle.plateMasked}
                          </span>
                        </div>
                        <p className="text-xs text-[#3a5aa8] mb-3">
                          {partner.businessName} • {item.hubName} • ★ {partner.rating} ({partner.completedTrips} trip)
                        </p>

                        {/* OSRM Route & ETA Quote */}
                        <div className="rounded-lg bg-[#e6dbc7]/50 p-2.5 text-xs mb-3 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold block">
                              Antar ke titik jemput ({routeQuote.distanceKm} km • ~{routeQuote.durationMinutes} mnt)
                            </span>
                            <span className="text-[#3a5aa8] text-[11px]">
                              {routeQuote.source === 'ZONE_FALLBACK'
                                ? 'Estimasi tarif zona'
                                : 'Rute jalan OSRM / OSM'}
                            </span>
                          </div>
                          <span className="font-mono font-semibold text-right shrink-0">
                            {routeQuote.isFreeZone ? 'GRATIS' : formatRp(routeQuote.deliveryFee)}
                          </span>
                        </div>

                        {/* Full BBM + Sopir Explicit Boundaries (FR-REN-14) */}
                        {packageType === 'FULL_BBM_DRIVER' &&
                          rateAvailable &&
                          vehicle.ratePlan.fullBbmTerms && (
                            <div className="rounded-lg bg-[#062b8a]/8 border border-[#062b8a]/20 p-3 text-xs space-y-1 mb-3">
                              <div className="flex items-center gap-1.5 font-semibold text-[#062b8a]">
                                <Fuel className="w-3.5 h-3.5" />
                                Batas Paket Full BBM + Sopir:
                              </div>
                              <p className="text-[#062b8a]/85">
                                Wilayah: {vehicle.ratePlan.fullBbmTerms.wilayah} (maks{' '}
                                <strong>{vehicle.ratePlan.fullBbmTerms.maxKm} km</strong>)
                              </p>
                              <p className="text-[#3a5aa8]">
                                Tol: {vehicle.ratePlan.fullBbmTerms.tollIncluded ? 'Termasuk' : 'Di luar paket'} •
                                Parkir: {vehicle.ratePlan.fullBbmTerms.parkingIncluded ? 'Termasuk' : 'Di luar paket'} •
                                Makan sopir: {vehicle.ratePlan.fullBbmTerms.driverMealIncluded ? 'Termasuk' : 'Di luar paket'}
                              </p>
                            </div>
                          )}

                        {/* Final Breakdown OR Honest Unavailable Alternative */}
                        {canBook && price ? (
                          <div className="border-t border-dotted border-[#062b8a]/30 pt-3 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[#3a5aa8]">
                                Sewa {durationHours} jam ({packageType === 'FULL_BBM_DRIVER' ? 'Full BBM + Sopir' : mode === 'DENGAN_SOPIR' ? 'Dengan Sopir' : 'Lepas Kunci'})
                              </span>
                              <span className="font-mono font-semibold">
                                {formatRp(price.baseRentalFee)}
                              </span>
                            </div>
                            {price.seasonalSurcharge > 0 && (
                              <div className="flex justify-between text-[#062b8a]">
                                <span>{price.seasonalLabel}</span>
                                <span className="font-mono font-semibold">
                                  +{formatRp(price.seasonalSurcharge)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-[#3a5aa8]">Biaya antar & jemput</span>
                              <span className="font-mono font-semibold">
                                {price.deliveryFee === 0 ? 'Rp 0' : formatRp(price.deliveryFee)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#3a5aa8]">
                                Deposit escrow {mode === 'DENGAN_SOPIR' ? '(bebas deposit)' : '(kembali)'}
                              </span>
                              <span className="font-mono font-semibold">
                                {formatRp(price.depositAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-[#062b8a]/15 text-sm font-semibold">
                              <span>Total Sewa Final</span>
                              <span className="font-mono">{formatRp(price.rentalTotal)}</span>
                            </div>
                            <p className="text-[11px] text-[#3a5aa8]">
                              Overtime: {formatRp(vehicle.ratePlan.overtimePerHour)}/jam • DP 30%:{' '}
                              <strong className="font-mono text-[#062b8a]">
                                {formatRp(price.dpAmount)}
                              </strong>
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-[#e6dbc7] p-3 text-xs space-y-2">
                            <div className="flex items-start gap-1.5 font-semibold text-[#062b8a]">
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>
                                {!rateAvailable
                                  ? `Tidak menawarkan ${durationHours} jam / ${packageType === 'FULL_BBM_DRIVER' ? 'Full BBM' : mode === 'LEPAS_KUNCI' ? 'Lepas Kunci' : 'Sopir'}`
                                  : item.conflictReason || 'Jadwal terisi'}
                              </span>
                            </div>
                            {item.alternativeOptions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {item.alternativeOptions.slice(0, 3).map((alt, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setDurationHours(alt.durationHours);
                                      handleModePackageSelect(alt.mode, alt.packageType);
                                    }}
                                    className="px-2 py-1 rounded bg-[#faf7f0] border border-[#062b8a]/25 text-[11px] font-semibold hover:bg-[#062b8a] hover:text-[#e6dbc7] cursor-pointer"
                                  >
                                    {alt.durationHours}j • {alt.mode === 'LEPAS_KUNCI' ? 'Lepas Kunci' : 'Sopir'} ({formatRp(alt.baseRate)})
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={!canBook}
                        onClick={() => {
                          setSelectedItem(item);
                          setCheckoutError(null);
                          setOcrResult(null);
                        }}
                        className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                          canBook
                            ? 'bg-[#062b8a] text-[#e6dbc7] hover:bg-[#041f66] cursor-pointer'
                            : 'bg-[#ddd0b9] text-[#3a5aa8] cursor-not-allowed'
                        }`}
                      >
                        <span>
                          {canBook
                            ? `${t.bookBtn} (${formatRp(price!.totalDueNow)})`
                            : 'Pilih Durasi / Jam Lain'}
                        </span>
                        {canBook && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* MULTI-PROVINCE INFRASTRUCTURE & 3 OSS PILLARS SECTION */}
      <section className="bg-[#faf7f0] border-t-2 border-[#062b8a]/15 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <h2 className="text-3xl font-semibold tracking-tight mb-3">
                Mulai di Jogja, arsitektur siap lintas provinsi
              </h2>
              <p className="text-sm sm:text-base text-[#3a5aa8] leading-relaxed mb-5">
                Setiap provinsi di Dolan punya konfigurasi tarif OSRM, batas geofence Traccar,
                daftar titik jemput (bandara/stasiun/hotel), aturan jeda sopir, dan rute SEO
                tersendiri — sehingga ekspansi dari DIY ke Jawa Tengah, Jawa Timur, dan Bali tidak
                perlu menulis ulang sistem inti.
              </p>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#062b8a] text-[#e6dbc7] text-sm font-semibold"
              >
                Buka Pengaturan Multi-Provinsi <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(data?.provinces || []).map((prov) => (
                <div
                  key={prov.id}
                  className={`p-5 rounded-xl border ${
                    prov.status === 'ACTIVE'
                      ? 'bg-[#e6dbc7]/45 border-[#062b8a]'
                      : 'bg-[#f4f3f1] border-[#062b8a]/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-semibold text-base">{prov.name}</span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        prov.status === 'ACTIVE'
                          ? 'bg-[#062b8a] text-[#e6dbc7]'
                          : 'bg-[#ddd0b9] text-[#062b8a]'
                      }`}
                    >
                      {prov.status === 'ACTIVE'
                        ? 'AKTIF MVP'
                        : prov.status === 'PILOT_READY'
                          ? 'SIAP PILOT V2'
                          : 'INFRASTRUKTUR SIAP'}
                    </span>
                  </div>
                  <p className="text-xs text-[#3a5aa8] mb-3">
                    Koridor: {prov.popularCorridors.join(' • ')}
                  </p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[#062b8a]/15">
                    <span className="font-mono text-[#062b8a]">/{prov.slug}</span>
                    <Link
                      href={`/sewa-mobil/${prov.slug}`}
                      className="font-semibold hover:underline"
                    >
                      Halaman SEO →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3 Verified Open-Source Integrations */}
          <div className="pt-8 border-t border-dotted border-[#062b8a]/30 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-[#e6dbc7]/40">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <Navigation className="w-4 h-4" /> 1. Traccar GPS & Geofence
              </div>
              <p className="text-xs text-[#3a5aa8] leading-relaxed">
                Pelacakan khusus unit lepas kunci selama masa sewa aktif (dengan persetujuan
                eksplisit penyewa). Keluar zona provinsi atau overdue memicu alert ke mitra & admin.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#e6dbc7]/40">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <MapPin className="w-4 h-4" /> 2. OSRM Road Routing & ETA
              </div>
              <p className="text-xs text-[#3a5aa8] leading-relaxed">
                Biaya antar bandara YIA / hotel dihitung dari jarak rute jalan OpenStreetMap dan ETA
                sebelum checkout, dengan fallback tarif zona bila layanan rute offline.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#e6dbc7]/40">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <ScanText className="w-4 h-4" /> 3. Tesseract OCR Pre-Check
              </div>
              <p className="text-xs text-[#3a5aa8] leading-relaxed">
                Ekstraksi otomatis nama, nomor, dan masa berlaku KTP/SIM A (`ind.traineddata`).
                Foto buram atau keyakinan rendah masuk antrean verifikasi manual admin — tidak
                pernah ditolak sepihak oleh bot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CHECKOUT + OCR + GPS CONSENT MODAL */}
      {selectedItem && selectedItem.price && (
        <div className="fixed inset-0 z-50 bg-[#062b8a]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#faf7f0] text-[#062b8a] border-2 border-[#062b8a] rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-[#e6dbc7] cursor-pointer"
              aria-label="Tutup modal checkout"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-semibold uppercase tracking-wider text-[#3a5aa8]">
              Checkout Transparan • Tanpa Biaya Kejutan
            </span>
            <h3 className="text-2xl font-semibold mt-1 mb-4">
              {selectedItem.vehicle.brandModel} ({durationHours} Jam)
            </h3>

            {/* Immutable Snapshot Preview */}
            <div className="rounded-xl bg-[#e6dbc7]/55 p-4 text-xs space-y-2 mb-5">
              <div className="flex justify-between">
                <span>Jadwal sewa</span>
                <span className="font-mono font-semibold">
                  {pickupDate} {pickupTime} → {endDisplay}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Titik ambil & rute OSRM</span>
                <span className="font-semibold">
                  {selectedItem.routeQuote.destinationName} ({selectedItem.routeQuote.distanceKm} km)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total sewa (termasuk antar)</span>
                <span className="font-mono font-semibold">
                  {formatRp(selectedItem.price.rentalTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>DP 30% dibayar sekarang</span>
                <span className="font-mono font-semibold">
                  {formatRp(selectedItem.price.dpAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Deposit escrow lepas kunci (dikembalikan)</span>
                <span className="font-mono font-semibold">
                  {formatRp(selectedItem.price.depositAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#062b8a]/20 text-sm font-semibold">
                <span>Total dibayar via Gateway sekarang</span>
                <span className="font-mono">{formatRp(selectedItem.price.totalDueNow)}</span>
              </div>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nama Lengkap Penyewa</label>
                  <input
                    required
                    value={renterName}
                    onChange={(e) => setRenterName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#062b8a]/25 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Nomor WhatsApp Aktif</label>
                  <input
                    required
                    value={renterPhone}
                    onChange={(e) => setRenterPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#062b8a]/25 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Email (Cadangan Voucher)</label>
                <input
                  required
                  type="email"
                  value={renterEmail}
                  onChange={(e) => setRenterEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#062b8a]/25 text-sm"
                />
              </div>

              {/* KTP + SIM A + Tesseract OCR Pre-check ONLY for Lepas Kunci (FR-REN-04 & Bab 9) */}
              {mode === 'LEPAS_KUNCI' && (
                <div className="rounded-xl border border-[#062b8a]/25 p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <ScanText className="w-4 h-4" />
                      Verifikasi KTP & SIM A (Pre-Check Tesseract OCR)
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-[11px] text-[#3a5aa8] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simulateBlurOcr}
                        onChange={(e) => setSimulateBlurOcr(e.target.checked)}
                      />
                      Simulasi foto buram
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Nomor KTP (NIK)</label>
                      <input
                        required
                        value={ktpNumber}
                        onChange={(e) => setKtpNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded bg-[#faf7f0] border border-[#062b8a]/20 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Nomor SIM A</label>
                      <input
                        required
                        value={simNumber}
                        onChange={(e) => setSimNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded bg-[#faf7f0] border border-[#062b8a]/20 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Berlaku Hingga</label>
                      <input
                        type="date"
                        required
                        value={simExpiry}
                        onChange={(e) => setSimExpiry(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded bg-[#faf7f0] border border-[#062b8a]/20 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleRunOcr}
                      disabled={ocrLoading}
                      className="px-3 py-1.5 rounded-lg bg-[#e6dbc7] text-[#062b8a] text-xs font-semibold hover:bg-[#ddd0b9] cursor-pointer"
                    >
                      {ocrLoading ? 'Memindai dengan Tesseract...' : 'Jalankan Pre-Check OCR'}
                    </button>
                    {ocrResult && (
                      <span
                        className={`text-xs font-medium inline-flex items-center gap-1 ${
                          ocrResult.needsManualReview ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Akurasi {Math.round(ocrResult.confidence * 100)}% —{' '}
                        {ocrResult.needsManualReview
                          ? 'Masuk antrean verifikasi manual Admin (FR-ADM-09)'
                          : `Terbaca: ${ocrResult.extractedName}`}
                      </span>
                    )}
                  </div>

                  {/* Mandatory Explicit GPS Tracking Consent (FR-REN-12) */}
                  <label className="flex items-start gap-2.5 pt-2 border-t border-[#062b8a]/15 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gpsConsent}
                      onChange={(e) => setGpsConsent(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      Saya menyetujui bahwa unit lepas kunci ini dilengkapi{' '}
                      <strong>pelacak GPS Traccar</strong> yang hanya aktif selama masa sewa untuk
                      keamanan unit & geofence wilayah DIY (FR-REN-12).
                    </span>
                  </label>
                </div>
              )}

              {/* Payment Gateway Choice */}
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Metode Pembayaran DP & Escrow
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['MIDTRANS', 'XENDIT'] as const).map((gw) => (
                    <button
                      key={gw}
                      type="button"
                      onClick={() => setGateway(gw)}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                        gateway === gw
                          ? 'bg-[#062b8a] text-[#e6dbc7] border-[#062b8a]'
                          : 'bg-white border-[#062b8a]/25 text-[#062b8a]'
                      }`}
                    >
                      {gw === 'MIDTRANS' ? 'Midtrans (QRIS / GoPay / VA)' : 'Xendit (VA / OVO / Kartu)'}
                    </button>
                  ))}
                </div>
              </div>

              {checkoutError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-300 text-red-800 text-xs font-medium">
                  {checkoutError}
                </div>
              )}

              <button
                type="submit"
                disabled={checkoutSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#062b8a] text-[#e6dbc7] text-sm font-semibold hover:bg-[#041f66] cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {checkoutSubmitting
                  ? 'Mengunci Kalender & Memproses DP...'
                  : `Bayar DP ${formatRp(selectedItem.price.totalDueNow)} & Kunci Unit`}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
