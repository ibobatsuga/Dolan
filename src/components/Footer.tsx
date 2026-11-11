import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#0D0D0D] text-white mt-auto pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/15">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-3 h-3 rounded-full bg-[#FF5500]" />
              <p className="text-3xl font-extrabold tracking-tight">Muvo</p>
            </div>
            <p className="text-sm text-white/70 max-w-md leading-relaxed">
              Marketplace sewa mobil terverifikasi untuk penyewa di DI Yogyakarta (Bandara YIA,
              Stasiun Tugu, Malioboro, Sleman) dengan infrastruktur siap ekspansi multi-provinsi:
              tarif final per 6/12/24 jam, anti-double-book, estimasi rute OSRM, dan proteksi escrow.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#FF5500] mb-3">
              Wilayah Layanan
            </p>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link href="/sewa-mobil/jogja" className="hover:text-[#FF5500] transition-colors">
                  Sewa Mobil Jogja (DIY Aktif)
                </Link>
              </li>
              <li>
                <Link href="/en/rent-car/jogja" className="hover:text-[#FF5500] transition-colors">
                  Rent a Car Yogyakarta (EN)
                </Link>
              </li>
              <li>
                <Link
                  href="/sewa-mobil/jawa-tengah"
                  className="hover:text-[#FF5500] transition-colors"
                >
                  Jawa Tengah — Solo & Semarang (V2)
                </Link>
              </li>
              <li>
                <Link
                  href="/sewa-mobil/jawa-timur"
                  className="hover:text-[#FF5500] transition-colors"
                >
                  Jawa Timur — Surabaya & Malang (V2)
                </Link>
              </li>
              <li>
                <Link href="/sewa-mobil/bali" className="hover:text-[#FF5500] transition-colors">
                  Bali — Bandara DPS & Ubud (V2)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#FF5500] mb-3">
              Layanan Penyewa
            </p>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link href="/" className="hover:text-[#FF5500] transition-colors">
                  Cari & Bandingkan Mobil
                </Link>
              </li>
              <li>
                <Link
                  href="/booking/MVO-DIY-2601"
                  className="hover:text-[#FF5500] transition-colors"
                >
                  Voucher & Checklist Sewa
                </Link>
              </li>
              <li>
                <Link
                  href="/booking/MVO-DIY-2602"
                  className="hover:text-[#FF5500] transition-colors"
                >
                  Cek Status Booking Sampel
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white/55">
          <p>
            Muvo Mobility Marketplace • Peta & Rute: OpenStreetMap / Project-OSRM •
            Verifikasi Dokumen: OCR Pre-Check
          </p>
          <p>Deploy tim Fluxy • Multi-Province Ready</p>
        </div>
      </div>
    </footer>
  );
}
