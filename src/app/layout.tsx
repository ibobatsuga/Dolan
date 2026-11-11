import type { Metadata } from 'next';
import { Bricolage_Grotesque, Geist_Mono } from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Dolan — Marketplace Sewa Mobil Jogja & Infrastruktur Multi-Provinsi',
  description:
    'Cari mobil sewa di DI Yogyakarta (Bandara YIA, Stasiun Tugu, Malioboro, Sleman) dengan harga final transparan per durasi 6/12/24 jam, lepas kunci atau dengan sopir + full BBM.',
  keywords: [
    'sewa mobil jogja',
    'rental mobil jogja',
    'rent car jogja',
    'sewa mobil yogyakarta',
    'sewa mobil bandara yia',
    'dolan sewa mobil',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${bricolage.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#e6dbc7] text-[#062b8a]">
        {children}
      </body>
    </html>
  );
}
