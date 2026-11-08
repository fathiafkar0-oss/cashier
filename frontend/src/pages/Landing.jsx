import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, ChefHat, QrCode, BarChart3, ScanLine, Utensils, Wallet,
  Menu as MenuIcon, X, MapPin, Phone, Clock,
} from 'lucide-react';
import heroImg from '../assets/hero-restoran.jpg';

const NAV = [
  { href: '#beranda', label: 'Beranda' },
  { href: '#fitur', label: 'Fitur' },
  { href: '#tentang', label: 'Tentang' },
  { href: '#cara-pesan', label: 'Cara Pesan' },
  { href: '#kontak', label: 'Kontak' },
];

const FEATURES = [
  {
    Icon: QrCode,
    title: 'Pesan via QR Meja',
    desc: 'Pelanggan scan QR di meja, pilih menu, dan bayar langsung dari HP tanpa antre.',
  },
  {
    Icon: ChefHat,
    title: 'Kasir Real-time',
    desc: 'Pesanan masuk otomatis ke papan antrean kasir dan dapur dalam hitungan detik.',
  },
  {
    Icon: BarChart3,
    title: 'Laporan Laba Harian',
    desc: 'Omzet, HPP, dan laba bersih tercatat otomatis di setiap transaksi.',
  },
];

const STATS = [
  { value: '≤ 4 Klik', label: 'Dari pilih menu sampai bayar' },
  { value: 'Real-time', label: 'Antrean kasir & dapur' },
  { value: 'Otomatis', label: 'Laporan omzet, HPP & laba' },
];

const STEPS = [
  { Icon: ScanLine, title: 'Scan QR di Meja', desc: 'Nomor meja terdeteksi otomatis, tidak perlu memanggil pelayan.' },
  { Icon: Utensils, title: 'Pilih Menu Favorit', desc: 'Lihat foto, harga, dan tambahkan catatan seperti “tanpa bawang”.' },
  { Icon: Wallet, title: 'Bayar QRIS / Tunai', desc: 'Bayar instan via QRIS atau di kasir, lalu pantau status pesanan.' },
];

function Ornament({ children }) {
  return (
    <p className="flex items-center justify-center gap-3 font-script text-2xl text-gold sm:text-3xl">
      <span className="h-1.5 w-1.5 rotate-45 bg-gold" aria-hidden="true" />
      {children}
      <span className="h-1.5 w-1.5 rotate-45 bg-gold" aria-hidden="true" />
    </p>
  );
}

function Divider() {
  return (
    <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 sm:px-6" aria-hidden="true">
      <span className="h-px flex-1 bg-white/15" />
      <span className="h-2 w-2 rotate-45 bg-white" />
      <span className="h-px flex-1 bg-white/15" />
    </div>
  );
}

const btnBase =
  'inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] transition';

export default function Landing() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-navy font-sans text-[#C3CDDD]">
      {/* ---------- Navbar ---------- */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#beranda" className="flex items-center gap-3 text-white">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/70">
              <ChefHat size={20} strokeWidth={1.5} className="text-gold" />
            </span>
            <span className="font-display text-xl font-semibold tracking-[0.12em]">MICRODINE</span>
          </a>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Navigasi utama">
            {NAV.map((n, i) => (
              <a
                key={n.href}
                href={n.href}
                className={`text-xs font-semibold uppercase tracking-[0.16em] transition hover:text-gold ${
                  i === 0 ? 'text-gold' : 'text-white/85'
                }`}
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/login"
              className="hidden border-b border-white/40 pb-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/85 transition hover:border-gold hover:text-gold md:inline"
            >
              Portal Karyawan
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center text-white md:hidden"
              aria-label={open ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={open}
            >
              {open ? <X size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="mx-4 border border-white/10 bg-navy-deep/95 p-4 backdrop-blur md:hidden">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/90"
              >
                {n.label}
              </a>
            ))}
            <Link to="/admin/login" className="block py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold">
              Portal Karyawan
            </Link>
          </div>
        )}
      </header>

      {/* ---------- Hero ---------- */}
      <section id="beranda" className="relative flex min-h-[100svh] items-center overflow-hidden">
        <img
          src={heroImg}
          alt="Suasana restoran dengan kasir digital dan pelanggan memesan lewat HP"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/85 via-navy-deep/65 to-navy" aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-16 pt-28 text-center sm:px-6">
          <p className="font-script text-3xl text-gold sm:text-4xl">Selamat Datang di Restoran Kami</p>
          <h1 className="mt-4 font-display text-[2.6rem] font-semibold leading-[1.08] text-white sm:text-6xl lg:text-7xl">
            Pesan Mudah,
            <br />
            Layanan Cepat
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Platform manajemen restoran terpadu untuk bisnis mikro Indonesia. Dari pesan mandiri di meja, kasir
            real-time, sampai laporan laba harian.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link to="/table-selection" className={`${btnBase} w-full bg-gold text-navy hover:bg-gold-soft sm:w-auto`}>
              Lihat Menu & Pesan <ArrowUpRight size={16} />
            </Link>
            <Link to="/admin/login" className={`${btnBase} w-full bg-white text-navy hover:bg-white/90 sm:w-auto`}>
              Portal Karyawan <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Fitur ---------- */}
      <section id="fitur" className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:grid-cols-3 sm:gap-8 sm:px-6">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="text-center">
              <Icon size={52} strokeWidth={1.1} className="mx-auto text-white" />
              <h3 className="mt-6 font-display text-lg font-semibold uppercase tracking-[0.08em] text-gold">{title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[#C3CDDD]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ---------- Tentang ---------- */}
      <section id="tentang" className="pb-20 pt-20 sm:pt-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Ornament>Kenapa Memilih Kami</Ornament>
          <h2 className="mt-4 font-display text-3xl font-semibold uppercase leading-tight text-gold sm:text-5xl">
            Restoran Digital
            <br />
            untuk Bisnis Mikro
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[#C3CDDD]">
            MICRODINE membantu warung dan restoran kecil naik kelas: pelanggan memesan sendiri, kasir tidak
            kewalahan, dan pemilik tahu persis berapa untung setiap hari, tanpa perangkat mahal.
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden sm:h-[460px]">
            <img
              src={heroImg}
              alt="Pelayan memakai tablet dan pelanggan membayar dengan QR"
              className="h-56 w-full object-cover sm:absolute sm:inset-0 sm:h-full"
            />
            <div className="absolute inset-0 hidden bg-gradient-to-t from-navy via-navy/30 to-transparent sm:block" aria-hidden="true" />
            <div className="relative grid gap-3 pt-3 sm:absolute sm:inset-x-0 sm:bottom-0 sm:grid-cols-3 sm:gap-4 sm:p-6">
              {STATS.map((s) => (
                <div key={s.label} className="border border-gold/25 bg-navy/85 px-5 py-4 backdrop-blur">
                  <p className="font-display text-2xl font-semibold text-gold sm:text-3xl">{s.value}</p>
                  <p className="mt-1 text-sm text-white/85">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Cara Pesan ---------- */}
      <section id="cara-pesan" className="bg-navy-soft py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <Ornament>Cara Memesan</Ornament>
            <h2 className="mt-4 font-display text-3xl font-semibold uppercase text-gold sm:text-5xl">Tiga Langkah Saja</h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {STEPS.map(({ Icon, title, desc }, i) => (
              <div key={title} className="border border-white/10 bg-navy/60 p-8">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-semibold text-gold/90">0{i + 1}</span>
                  <Icon size={30} strokeWidth={1.3} className="text-white" />
                </div>
                <h3 className="mt-6 font-display text-lg font-semibold uppercase tracking-[0.06em] text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#C3CDDD]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="py-20 text-center sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Ornament>Sudah lapar?</Ornament>
          <h2 className="mt-4 font-display text-3xl font-semibold uppercase leading-tight text-white sm:text-5xl">
            Pesan dari Meja Anda Sekarang
          </h2>
          <Link to="/table-selection" className={`${btnBase} mt-10 bg-gold text-navy hover:bg-gold-soft`}>
            Mulai Pesan <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer id="kontak" className="border-t border-white/10 bg-navy-deep">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-3 sm:px-6">
          <div>
            <div className="flex items-center gap-3 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/70">
                <ChefHat size={18} strokeWidth={1.5} className="text-gold" />
              </span>
              <span className="font-display text-lg font-semibold tracking-[0.12em]">MICRODINE</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">
              Inovasi platform manajemen restoran terpadu untuk mendorong kemandirian digital bisnis mikro Indonesia.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-gold">Kontak</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-gold" />Jl. Kaliurang Km 5 No. 12, Sleman, Yogyakarta</li>
              <li className="flex gap-3"><Phone size={16} className="mt-0.5 shrink-0 text-gold" />0812-3456-7890</li>
              <li className="flex gap-3"><Clock size={16} className="mt-0.5 shrink-0 text-gold" />Setiap hari, 10.00 – 22.00</li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-gold">Akses Cepat</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link to="/table-selection" className="transition hover:text-gold">Pesan dari meja</Link></li>
              <li><Link to="/admin/login" className="transition hover:text-gold">Portal kasir & admin</Link></li>
              <li><a href="#cara-pesan" className="transition hover:text-gold">Cara memesan</a></li>
            </ul>
          </div>
        </div>
        <p className="border-t border-white/10 py-6 text-center text-xs text-white/60">
          © 2026 MICRODINE · Semua hak dilindungi.
        </p>
      </footer>
    </div>
  );
}
