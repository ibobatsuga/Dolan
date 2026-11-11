import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#062b8a] text-[#e6dbc7] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#e6dbc7]/20">
          <div className="md:col-span-2">
            <p className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
              Dolan
            </p>
            <p className="text-sm text-[#e6dbc7]/80 max-w-md leading-relaxed">
              Marketplace sewa mobil lokal yang dimulai dari DI Yogyakarta dan dibangun di atas
              infrastruktur multi-provinsi: harga final per durasi 6/12/24 jam, kalender
              anti-double-book, rute OSRM, pelacakan GPS Traccar, dan pre-check OCR Tesseract.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#e6dbc7]/60 mb-3">
              Halaman SEO & Provinsi
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/sewa-mobil/jogja" className="hover:underline">
                  Sewa Mobil Jogja (DIY Aktif)
                </Link>
              </li>
              <li>
                <Link href="/en/rent-car/jogja" className="hover:underline">
                  Rent a Car Yogyakarta (EN)
                </Link>
              </li>
              <li>
                <Link href="/sewa-mobil/jawa-tengah" className="hover:underline">
                  Jawa Tengah — Solo & Semarang (V2)
                </Link>
              </li>
              <li>
                <Link href="/sewa-mobil/jawa-timur" className="hover:underline">
                  Jawa Timur — Surabaya & Malang (V2)
                </Link>
              </li>
              <li>
                <Link href="/sewa-mobil/bali" className="hover:underline">
                  Bali — Bandara DPS & Ubud (V2)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#e6dbc7]/60 mb-3">
              Portal Ekosistem
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:underline">
                  Cari Mobil & Checkout
                </Link>
              </li>
              <li>
                <Link href="/booking/DLN-DIY-2601" className="hover:underline">
                  Voucher & Checklist Serah-Terima
                </Link>
              </li>
              <li>
                <Link href="/mitra" className="hover:underline">
                  Dashboard SaaS Mitra (Gratis)
                </Link>
              </li>
              <li>
                <Link href="/sopir" className="hover:underline">
                  Aplikasi Tugas Sopir
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:underline">
                  Admin Ops, OCR, GPS & Ledger
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#e6dbc7]/70">
          <p>
            Dolan Mobility Marketplace • Data Peta & Rute: OpenStreetMap / Project-OSRM •
            Pelacakan GPS: Traccar • Pre-Check Dokumen: Tesseract OCR
          </p>
          <p>Dideploy di tim Fluxy • Multi-Province Architecture</p>
        </div>
      </div>
    </footer>
  );
}
