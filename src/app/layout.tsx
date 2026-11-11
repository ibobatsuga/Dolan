import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Muvo — Marketplace Sewa Mobil Jogja & Multi-Provinsi',
  description:
    'Cari & sewa mobil terverifikasi di DI Yogyakarta (Bandara YIA, Stasiun Tugu, Malioboro, Sleman) dengan harga final transparan per 6/12/24 jam, lepas kunci atau dengan sopir + full BBM.',
  keywords: [
    'muvo',
    'muvo sewa mobil',
    'sewa mobil jogja',
    'rental mobil jogja',
    'rent car yogyakarta',
    'sewa mobil bandara yia',
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
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F7F7F8] text-[#0D0D0D] selection:bg-[#FF5500]/15 selection:text-[#0D0D0D]">
        {children}
      </body>
    </html>
  );
}
