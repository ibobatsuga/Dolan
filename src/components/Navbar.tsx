'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Calendar,
  CarFront,
  GitCompareArrows,
  Globe2,
  Heart,
  Home,
  MapPin,
  Search,
  User,
} from 'lucide-react';
import { UserTab } from '@/components/user/types';

interface NavbarProps {
  theme?: 'sand' | 'ledger' | 'user';
  activeProvinceSlug?: string;
  onSelectProvince?: (slug: string) => void;
  lang?: 'id' | 'en';
  onToggleLang?: () => void;
  activeTab?: UserTab;
  onSelectTab?: (tab: UserTab) => void;
  wishlistCount?: number;
  compareCount?: number;
  notifCount?: number;
  userName?: string;
  loggedIn?: boolean;
  onOpenAuth?: () => void;
  onOpenCompare?: () => void;
}

export function Navbar({
  activeProvinceSlug = 'jogja',
  onSelectProvince,
  lang = 'id',
  onToggleLang,
  activeTab = 'home',
  onSelectTab,
  wishlistCount = 0,
  compareCount = 0,
  notifCount = 2,
  userName = 'Masuk',
  loggedIn = false,
  onOpenAuth,
  onOpenCompare,
}: NavbarProps) {
  const pathname = usePathname();
  const isHomeRoute =
    pathname === '/' ||
    pathname.startsWith('/sewa-mobil') ||
    pathname.startsWith('/en/rent-car');

  const navItems: Array<{
    tab: UserTab;
    href: string;
    label: string;
    icon: typeof Home;
    badge?: number;
  }> = [
    { tab: 'home', href: '/', label: lang === 'en' ? 'Home' : 'Beranda', icon: Home },
    { tab: 'search', href: '/#cari', label: lang === 'en' ? 'Search' : 'Cari Mobil', icon: Search },
    {
      tab: 'wishlist',
      href: '/#wishlist',
      label: 'Wishlist',
      icon: Heart,
      badge: wishlistCount > 0 ? wishlistCount : undefined,
    },
    {
      tab: 'bookings',
      href: '/booking/MVO-DIY-2601',
      label: lang === 'en' ? 'Bookings' : 'Booking',
      icon: Calendar,
    },
    { tab: 'profile', href: '/#profil', label: lang === 'en' ? 'Profile' : 'Profil', icon: User },
  ];

  const handleTabClick = (item: (typeof navItems)[number], e: React.MouseEvent) => {
    if (isHomeRoute && onSelectTab) {
      e.preventDefault();
      onSelectTab(item.tab);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2.5 flex-nowrap">
          {/* Left: Brand + Province selector (single line) */}
          <div className="flex items-center gap-2.5 shrink-0 flex-nowrap min-w-0">
            <Link
              href="/"
              onClick={(e) => {
                if (isHomeRoute && onSelectTab) {
                  e.preventDefault();
                  onSelectTab('home');
                }
              }}
              className="flex items-center gap-2 group shrink-0 whitespace-nowrap"
            >
              <span className="w-9 h-9 rounded-xl bg-[#0D0D0D] text-white flex items-center justify-center shrink-0 relative overflow-hidden">
                <CarFront className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF5500]" />
              </span>
              <span className="leading-none whitespace-nowrap">
                <span className="text-xl font-extrabold tracking-tight text-[#0D0D0D] block">
                  Muvo
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#FF5500] font-bold hidden xl:block whitespace-nowrap">
                  Car Rental User
                </span>
              </span>
            </Link>

            {onSelectProvince ? (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-black/15 bg-[#F7F7F8] px-3 py-1.5 text-xs shrink-0 whitespace-nowrap">
                <MapPin className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                <select
                  aria-label="Pilih Provinsi"
                  value={activeProvinceSlug}
                  onChange={(e) => onSelectProvince(e.target.value)}
                  className="bg-transparent font-semibold text-[#0D0D0D] focus:outline-none cursor-pointer whitespace-nowrap"
                >
                  <option value="jogja">DI Yogyakarta (Aktif)</option>
                  <option value="jawa-tengah">Jawa Tengah (V2)</option>
                  <option value="jawa-timur">Jawa Timur (V2)</option>
                  <option value="bali">Bali (V2)</option>
                </select>
              </div>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#FFF2EB] text-[#FF5500] px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shrink-0">
                <MapPin className="w-3 h-3" /> Jogja (DIY)
              </span>
            )}
          </div>

          {/* Center: 1-line User Tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F7F7F8] p-1 rounded-full border border-black/10 overflow-x-auto no-scrollbar flex-nowrap">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isHomeRoute
                ? activeTab === item.tab
                : item.tab === 'bookings' && pathname.startsWith('/booking');
              return (
                <Link
                  key={item.tab}
                  href={item.href}
                  onClick={(e) => handleTabClick(item, e)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#0D0D0D] text-white'
                      : 'text-[#0D0D0D]/75 hover:text-[#0D0D0D] hover:bg-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#FF5500]' : ''}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#FF5500] text-white text-[10px] font-bold tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Compare, Notifications, Language, Auth Pill */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
            {onOpenCompare && (
              <button
                type="button"
                onClick={onOpenCompare}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  compareCount > 0
                    ? 'border-[#FF5500] bg-[#FFF2EB] text-[#FF5500]'
                    : 'border-black/15 bg-white text-[#0D0D0D] hover:bg-[#F7F7F8]'
                }`}
              >
                <GitCompareArrows className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'en' ? 'Compare' : 'Bandingkan'}</span>
                {compareCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#FF5500] text-white text-[10px] leading-none font-bold tabular-nums">
                    {compareCount}
                  </span>
                )}
              </button>
            )}

            {isHomeRoute && onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('profile')}
                aria-label="Notifikasi"
                className="relative w-9 h-9 rounded-full border border-black/15 bg-white hover:bg-[#F7F7F8] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Bell className="w-4 h-4 text-[#0D0D0D]" />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FF5500] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {notifCount}
                  </span>
                )}
              </button>
            )}

            {onToggleLang && (
              <button
                type="button"
                onClick={onToggleLang}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-black/15 bg-white hover:bg-[#F7F7F8] text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Globe2 className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>{lang === 'id' ? 'ID' : 'EN'}</span>
              </button>
            )}

            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  loggedIn
                    ? 'bg-[#F7F7F8] border border-black/15 text-[#0D0D0D] hover:border-[#FF5500]'
                    : 'bg-[#0D0D0D] text-white hover:bg-[#FF5500]'
                }`}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="max-w-[90px] truncate">
                  {loggedIn ? userName.split(' ')[0] : lang === 'en' ? 'Sign In' : 'Masuk'}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom 5-Tab Bar matching Reference Screenshots */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-black/10 px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isHomeRoute
            ? activeTab === item.tab
            : item.tab === 'bookings' && pathname.startsWith('/booking');
          return (
            <Link
              key={item.tab}
              href={item.href}
              onClick={(e) => handleTabClick(item, e)}
              className="relative flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl min-w-[58px] whitespace-nowrap"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-[#FF5500]' : 'text-[#0D0D0D]/60'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-[14px] h-3.5 rounded-full bg-[#FF5500] text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold whitespace-nowrap ${
                  isActive ? 'text-[#FF5500]' : 'text-[#0D0D0D]/65'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
