# Dolan — Marketplace Sewa Mobil Jogja & Infrastruktur Multi-Provinsi

**Dolan** adalah marketplace sewa mobil lokal yang diluncurkan pertama kali untuk **Provinsi DI Yogyakarta (DIY)** (Kota Yogyakarta, Sleman, Bantul, Kulon Progo / Bandara YIA, Gunungkidul) dan dirancang dengan arsitektur **multi-provinsi** agar siap ekspansi ke Jawa Tengah, Jawa Timur, Bali, dan provinsi lainnya tanpa menulis ulang sistem inti.

## Arsitektur & Fitur Utama (PRD Riset v0.3)

1. **Marketplace Penyewa (`/`, `/sewa-mobil/[province]`, `/en/rent-car/[province]`)**
   - Pencarian tanggal + jam mulai fleksibel dengan durasi **6 / 12 / 24 jam** dan harga mandiri per durasi.
   - Pilihan mode **Lepas Kunci (Unit Saja)**, **Dengan Sopir (Non-BBM)**, dan tingkatan paket **Full BBM + Sopir** dengan batas wilayah, jarak km, tol/parkir/makan sopir tertulis sebelum checkout.
   - Rincian harga final di depan (tanpa biaya tersembunyi), ongkos antar berbasis rute jalan **OSRM / OpenStreetMap** (dengan fallback tarif zona), dan hitung mundur/aturan pembatalan simetris.
   - Verifikasi **KTP & SIM A** sekali pakai dengan pre-check **Tesseract OCR** (`ind.traineddata`) dan persetujuan eksplisit pelacakan **GPS Traccar** untuk unit lepas kunci.
2. **Voucher & Pengelolaan Sewa (`/booking/[code]`)**
   - Voucher digital dengan titik jemput, masa tunggu bandara/stasiun, snapshot harga & paket terkunci, pengajuan **extend** (validasi kalender & jeda sopir), pembatalan simetris, serta **checklist foto serah-terima dua pihak** yang terkunci permanen.
3. **SaaS Gratis Mitra (`/mitra`)**
   - Kalender armada terpadu anti-double-book (termasuk **paruh jam cuci/cek 30 menit pasca-booking 6 jam**).
   - Pengaturan harga mandiri per durasi, penerimaan pesanan, penugasan sopir dengan validasi **jeda istirahat minimum 8 jam**, ledger keuangan & ekspor CSV, serta monitor GPS Traccar.
4. **Aplikasi Sopir Mitra (`/sopir`)**
   - Akses terbatas hanya ke jadwal tugas hari ini, titik jemput, kontak tamu, dan batas rute/BBM paket (tanpa data keuangan mitra).
5. **Admin Ops & Kendali Multi-Provinsi (`/admin`)**
   - Antrean verifikasi dokumen & hasil OCR (keputusan akhir tetap manusia).
   - Monitoring GPS & alert geofence Traccar + meja sengketa & pelepasan escrow deposit.
   - Pengaturan parameter provinsi tanpa deploy (status wilayah `ACTIVE` / `PILOT_READY` / `EXPANSION_PLANNED`, durasi paruh jam, DP%, komisi%, batas istirahat sopir, ambang OCR, dan tarif OSRM).

## Infrastruktur Produksi & Self-Hosted OSS

- `prisma/schema.prisma`: Skema PostgreSQL relasional multi-provinsi (`Province`, `CityHub`, `PickupPoint`, `PlatformRegionConfig`, `Vehicle`, `ListingRatePlan`, `AvailabilityBlock`, `Booking`, `DriverAssignment`, `PaymentLedgerEntry`, `HandoverChecklist`, `GpsPosition`, `GeofenceEvent`, `ClaimDispute`, `OcrResult`).
- `docker-compose.yml`: Stack PostgreSQL 16, **Traccar** (`traccar/traccar`), **OSRM** (`Project-OSRM/osrm-backend`), dan **Tesseract OCR** (`ind+eng`).
- Adapter produksi di `src/lib/integrations/` untuk OSRM, Traccar, Tesseract OCR, Midtrans/Xendit idempotent ledger, dan Meta WhatsApp Business Cloud API.

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Untuk menyalakan infrastruktur self-hosted (Postgres, Traccar, OSRM, Tesseract):

```bash
cp .env.example .env
docker compose up -d
```
