'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, MapPin, ShieldCheck, Car, Calendar, Users } from 'lucide-react';

interface NavbarProps {
  lang?: 'id' | 'en';
  onLangChange?: (lang: 'id' | 'en') => void;
  activeProvinceSlug?: string;
  onProvinceChange?: (slug: string) => void;
  theme?: 'sand' | 'ledger';
}

export function Navbar({
  lang = 'id',
  onLangChange,
  activeProvinceSlug = 'jogja',
  onProvinceChange,
  theme = 'sand',
}: NavbarProps) {
  const pathname = usePathname();
  const isLedger = theme === 'ledger';

  const navLinks = [
    { href: '/', label: lang === 'en' ? 'Find Cars' : 'Cari Mobil', icon: Car },
    { href: '/booking/DLN-DIY-2601', label: lang === 'en' ? 'My Voucher' : 'Voucher Saya', icon: Calendar },
    { href: '/mitra', label: lang === 'en' ? 'Partner SaaS' : 'SaaS Mitra', icon: Users },
    { href: '/sopir', label: lang === 'en' ? 'Driver' : 'Sopir', icon: MapPin },
    { href: '/admin', label: 'Admin Ops', icon: ShieldCheck },
  ];

  return (
    <header
      className={`sticky top-0 z-40 border-b ${
        isLedger
          ? 'bg-[#ffffff] border-[#e2e0dc] text-[#14171f]'
          : 'bg-[#e6dbc7]/95 backdrop-blur-sm border-[#062b8a]/15 text-[#062b8a]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex flex-nowrap items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex flex-nowrap items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0 whitespace-nowrap">
            <svg
              width="34"
              height="34"
              viewBox="0 0 34 34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect
                width="34"
                height="34"
                rx="8"
                fill={isLedger ? '#14171f' : '#062b8a'}
              />
              <path
                d="M9 11H16.5C21.2 11 24.5 13.7 24.5 17C24.5 20.3 21.2 23 16.5 23H9V11Z"
                stroke={isLedger ? '#ffffff' : '#e6dbc7'}
                strokeWidth="2.4"
              />
              <circle
                cx="15.5"
                cy="17"
                r="2.2"
                fill={isLedger ? '#1d5fbf' : '#e6dbc7'}
              />
            </svg>
            <div className="leading-none whitespace-nowrap">
              <span className="text-xl font-semibold tracking-tight block">Dolan</span>
              <span
                className={`text-[11px] font-medium tracking-wide ${
                  isLedger ? 'text-[#5b616e]' : 'text-[#3a5aa8]'
                }`}
              >
                {activeProvinceSlug === 'jogja'
                  ? 'DIY • Jogja Pilot'
                  : `${activeProvinceSlug.toUpperCase()} • Ekspansi`}
              </span>
            </div>
          </Link>

          {onProvinceChange && (
            <div className="hidden lg:flex flex-nowrap items-center gap-1.5 pl-3 border-l border-current/15 shrink-0">
              <MapPin className="w-3.5 h-3.5 opacity-70 shrink-0" />
              <select
                aria-label="Pilih Provinsi"
                value={activeProvinceSlug}
                onChange={(e) => onProvinceChange(e.target.value)}
                className={`text-xs font-medium rounded-md px-2 py-1 border cursor-pointer focus:outline-none whitespace-nowrap shrink-0 ${
                  isLedger
                    ? 'bg-[#f4f3f1] border-[#d8d5cf] text-[#14171f]'
                    : 'bg-[#faf7f0] border-[#062b8a]/20 text-[#062b8a]'
                }`}
              >
                <option value="jogja">DI Yogyakarta (Aktif)</option>
                <option value="jawa-tengah">Jawa Tengah (Siap Ekspansi)</option>
                <option value="jawa-timur">Jawa Timur (Infrastruktur Siap)</option>
                <option value="bali">Bali (Infrastruktur Siap)</option>
              </select>
            </div>
          )}
        </div>

        <nav className="flex flex-nowrap items-center gap-1 shrink-0">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname?.startsWith(item.href.split('/').slice(0, 2).join('/'));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? isLedger
                      ? 'bg-[#14171f] text-white'
                      : 'bg-[#062b8a] text-[#e6dbc7]'
                    : isLedger
                      ? 'text-[#4b505b] hover:bg-[#f4f3f1]'
                      : 'text-[#062b8a] hover:bg-[#ddd0b9]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {onLangChange && (
          <button
            type="button"
            onClick={() => onLangChange(lang === 'id' ? 'en' : 'id')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isLedger
                ? 'border-[#d8d5cf] hover:bg-[#f4f3f1]'
                : 'border-[#062b8a]/25 bg-[#faf7f0] hover:bg-[#ddd0b9]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>{lang === 'id' ? 'ID / EN' : 'EN / ID'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
