'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Tag,
  User as UserIcon,
  X,
} from 'lucide-react';
import { UserAccount } from './types';

interface UserAuthModalProps {
  open: boolean;
  onClose: () => void;
  account: UserAccount;
  onAuthSuccess: (nextAccount: UserAccount) => void;
  lang: 'id' | 'en';
}

type AuthScreen = 'onboarding' | 'login' | 'register' | 'forgot';

export function UserAuthModal({
  open,
  onClose,
  account,
  onAuthSuccess,
  lang,
}: UserAuthModalProps) {
  const [screen, setScreen] = useState<AuthScreen>('onboarding');
  const [slide, setSlide] = useState(0);
  const [showPass, setShowPass] = useState(false);

  const [name, setName] = useState(account.name || 'Nadia Kusuma');
  const [email, setEmail] = useState(account.email || 'nadia.kusuma@muvo.id');
  const [phone, setPhone] = useState(account.phone || '081299887766');
  const [password, setPassword] = useState('muvojogja123');
  const [resetSent, setResetSent] = useState(false);

  if (!open) return null;

  const slides = [
    {
      title: lang === 'en' ? 'Welcome to' : 'Selamat Datang di',
      highlight: 'Muvo Marketplace',
      desc:
        lang === 'en'
          ? 'Explore, compare, and rent verified cars across Yogyakarta with upfront pricing.'
          : 'Jelajahi, bandingkan, dan sewa mobil terverifikasi di Jogja dengan tarif final tanpa biaya tersembunyi.',
      image: '/images/car-executive.jpg',
      metrics: [
        { icon: ShieldCheck, label: 'Mitra Terverifikasi' },
        { icon: Tag, label: 'Tarif Final 6/12/24J' },
        { icon: Sparkles, label: 'Anti-Double-Book' },
      ],
    },
    {
      title: lang === 'en' ? 'Find Your' : 'Temukan Unit',
      highlight: lang === 'en' ? 'Ideal Ride' : 'Sesuai Rute',
      desc:
        lang === 'en'
          ? 'From Bandara YIA airport pickups to Malioboro city drives with driver or self-drive.'
          : 'Dari penjemputan Bandara YIA, Stasiun Tugu, hingga keliling Malioboro—lepas kunci atau dengan sopir.',
      image: '/images/car-mpv.jpg',
      metrics: [
        { icon: ShieldCheck, label: '100+ Unit Siap' },
        { icon: Tag, label: '25+ Mitra Jogja' },
        { icon: Sparkles, label: '4.9 ★ Rating' },
      ],
    },
  ];

  const handleCompleteAuth = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthSuccess({
      loggedIn: true,
      name: name.trim() || 'Penyewa Muvo',
      email: email.trim() || 'penyewa@muvo.id',
      phone: phone.trim() || '081299887766',
      ktpVerified: account.ktpVerified,
      simVerified: account.simVerified,
      memberTier: 'Muvo Prioritas',
    });
    onClose();
  };

  const handleSocialLogin = (provider: string) => {
    onAuthSuccess({
      loggedIn: true,
      name: provider === 'Google' ? 'Nadia Kusuma' : 'Rama Wijaya',
      email: provider === 'Google' ? 'nadia.kusuma@gmail.com' : 'rama@icloud.com',
      phone: account.phone || '081299887766',
      ktpVerified: true,
      simVerified: true,
      memberTier: 'Muvo Prioritas',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-black/10 relative">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          {screen === 'onboarding' ? (
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5500]">
              Muvo • Penyewa
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                setResetSent(false);
                setScreen(screen === 'forgot' ? 'login' : 'onboarding');
              }}
              className="text-xs font-semibold text-[#0D0D0D]/70 hover:text-[#0D0D0D] cursor-pointer whitespace-nowrap"
            >
              ← Kembali
            </button>
          )}
          <div className="flex items-center gap-2">
            {screen === 'onboarding' && (
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="text-xs font-semibold text-[#0D0D0D]/60 hover:text-[#FF5500] cursor-pointer whitespace-nowrap"
              >
                Lewati
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="w-8 h-8 rounded-full bg-[#F7F7F8] flex items-center justify-center hover:bg-black/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {screen === 'onboarding' && (
          <div className="px-6 pb-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0D0D0D] leading-tight">
              {slides[slide].title}{' '}
              <span className="text-[#FF5500] block">{slides[slide].highlight}</span>
            </h2>
            <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">{slides[slide].desc}</p>

            <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-[#F7F7F8] my-4 border border-black/5">
              <Image
                src={slides[slide].image}
                alt={slides[slide].highlight}
                fill
                className="object-cover"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              {slides[slide].metrics.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className="rounded-xl bg-[#F7F7F8] border border-black/5 p-2.5 text-center"
                  >
                    <Icon className="w-4 h-4 text-[#FF5500] mx-auto mb-1" />
                    <span className="text-[11px] font-bold text-[#0D0D0D] block leading-tight">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5 mb-5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSlide(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    slide === idx ? 'w-6 bg-[#FF5500]' : 'w-2 bg-black/15'
                  }`}
                />
              ))}
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  if (slide === 0) setSlide(1);
                  else setScreen('login');
                }}
                className="w-full h-12 rounded-full bg-[#0D0D0D] hover:bg-[#1a1a1a] text-white text-sm font-bold flex items-center justify-between px-5 cursor-pointer transition-colors"
              >
                <span>{slide === 0 ? 'Lanjutkan' : 'Mulai Sekarang'}</span>
                <span className="w-8 h-8 rounded-full bg-[#FF5500] text-white flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('Google')}
                className="w-full h-11 rounded-full border border-black/15 bg-white hover:bg-[#F7F7F8] text-xs font-bold text-[#0D0D0D] cursor-pointer"
              >
                Lanjutkan cepat dengan Google
              </button>
            </div>
          </div>
        )}

        {screen === 'login' && (
          <form onSubmit={handleCompleteAuth} className="px-6 pb-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0D0D0D]">Welcome Back!</h2>
                <p className="text-xs font-semibold text-[#FF5500]">
                  Masuk untuk kelola sewa mobilmu
                </p>
              </div>
              <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-[#F7F7F8] shrink-0">
                <Image src="/images/car-city.jpg" alt="Muvo" fill className="object-cover" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block rounded-2xl bg-[#F7F7F8] border border-black/10 px-3.5 py-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                  Email Address
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Mail className="w-4 h-4 text-[#FF5500] shrink-0" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold focus:outline-none"
                    placeholder="nama@email.com"
                  />
                </div>
              </label>

              <label className="block rounded-2xl bg-[#F7F7F8] border border-black/10 px-3.5 py-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                  Password
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Lock className="w-4 h-4 text-[#0D0D0D]/60 shrink-0" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="text-[#6B7280] hover:text-[#0D0D0D] cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 font-medium text-[#6B7280]">
                <input type="checkbox" defaultChecked className="accent-[#FF5500] rounded" />
                Ingat saya
              </label>
              <button
                type="button"
                onClick={() => setScreen('forgot')}
                className="font-bold text-[#FF5500] hover:underline cursor-pointer"
              >
                Lupa Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-full bg-[#0D0D0D] hover:bg-[#1a1a1a] text-white text-sm font-bold flex items-center justify-between px-5 cursor-pointer"
            >
              <span>Masuk Sekarang</span>
              <span className="w-8 h-8 rounded-full bg-[#FF5500] text-white flex items-center justify-center">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleSocialLogin('Google')}
                className="h-10 rounded-full border border-black/15 text-xs font-bold hover:bg-[#F7F7F8] cursor-pointer"
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('Apple')}
                className="h-10 rounded-full border border-black/15 text-xs font-bold hover:bg-[#F7F7F8] cursor-pointer"
              >
                Apple ID
              </button>
            </div>

            <p className="text-center text-xs text-[#6B7280]">
              Belum punya akun Muvo?{' '}
              <button
                type="button"
                onClick={() => setScreen('register')}
                className="font-bold text-[#FF5500] hover:underline cursor-pointer"
              >
                Daftar Gratis
              </button>
            </p>
          </form>
        )}

        {screen === 'register' && (
          <form onSubmit={handleCompleteAuth} className="px-6 pb-6 space-y-3">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0D0D0D]">Buat Akun Muvo</h2>
              <p className="text-xs font-semibold text-[#FF5500]">
                Simpan favorit & percepat verifikasi KTP/SIM
              </p>
            </div>

            <label className="block rounded-2xl bg-[#F7F7F8] border border-black/10 px-3.5 py-2">
              <span className="text-[10px] font-bold uppercase text-[#6B7280]">Nama Lengkap</span>
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#FF5500]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none"
                />
              </div>
            </label>

            <label className="block rounded-2xl bg-[#F7F7F8] border border-black/10 px-3.5 py-2">
              <span className="text-[10px] font-bold uppercase text-[#6B7280]">Email</span>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0D0D0D]/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none"
                />
              </div>
            </label>

            <label className="block rounded-2xl bg-[#F7F7F8] border border-black/10 px-3.5 py-2">
              <span className="text-[10px] font-bold uppercase text-[#6B7280]">Nomor WhatsApp</span>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#0D0D0D]/60" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none"
                />
              </div>
            </label>

            <label className="block rounded-2xl bg-[#F7F7F8] border border-black/10 px-3.5 py-2">
              <span className="text-[10px] font-bold uppercase text-[#6B7280]">Password</span>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0D0D0D]/60" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none"
                />
              </div>
            </label>

            <button
              type="submit"
              className="w-full h-12 rounded-full bg-[#0D0D0D] hover:bg-[#1a1a1a] text-white text-sm font-bold flex items-center justify-between px-5 cursor-pointer"
            >
              <span>Daftar & Masuk</span>
              <span className="w-8 h-8 rounded-full bg-[#FF5500] text-white flex items-center justify-center">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            <p className="text-center text-xs text-[#6B7280]">
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="font-bold text-[#FF5500] hover:underline cursor-pointer"
              >
                Masuk
              </button>
            </p>
          </form>
        )}

        {screen === 'forgot' && (
          <div className="px-6 pb-6 space-y-4">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0D0D0D]">Lupa Kata Sandi?</h2>
              <p className="text-xs font-semibold text-[#FF5500]">
                Masukkan emailmu untuk menerima tautan reset aman.
              </p>
            </div>
            <label className="block rounded-2xl bg-[#F7F7F8] border border-black/10 px-3.5 py-2.5">
              <span className="text-[10px] font-bold uppercase text-[#6B7280]">Email</span>
              <div className="flex items-center gap-2 mt-0.5">
                <Mail className="w-4 h-4 text-[#FF5500]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none"
                />
              </div>
            </label>
            <button
              type="button"
              onClick={() => setResetSent(true)}
              className="w-full h-12 rounded-full bg-[#0D0D0D] text-white text-sm font-bold flex items-center justify-between px-5 cursor-pointer"
            >
              <span>Kirim Tautan Reset</span>
              <span className="w-8 h-8 rounded-full bg-[#FF5500] text-white flex items-center justify-center">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            {resetSent && (
              <div className="rounded-2xl bg-[#FFF2EB] border border-[#FF5500]/30 p-3 text-xs font-semibold text-[#0D0D0D] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FF5500] shrink-0" />
                Tautan reset kata sandi telah dikirim ke {email}.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
