import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, ChefHat, QrCode, BarChart3, ScanLine, Utensils, Wallet,
  Menu as MenuIcon, X, MapPin, Phone, Clock,
} from 'lucide-react';
import Ornament from '../components/brand/Ornament';
import heroImg from '../assets/hero-restoran.jpg';
import foodSpread from '../assets/food.jpg';
import kitchenImg from '../assets/resto.jpg';
import posImg from '../assets/resto2.jpg';
import receiptImg from '../assets/resto3.jpg';
import cakeImg from '../assets/makanan (1).jpg';
import nasgorKampungImg from '../assets/makanan (2).jpg';
import nasgorSpesialImg from '../assets/makanan (3).jpg';
import pastryImg from '../assets/makanan (4).jpg';

const NAV = [
  { href: '#beranda', label: 'Beranda' },
  { href: '#tentang', label: 'Tentang' },
  { href: '#menu', label: 'Menu' },
  { href: '#cara-pesan', label: 'Cara Pesan' },
  { href: '#kontak', label: 'Kontak' },
];

const FEATURES = [
  { Icon: QrCode, title: 'Pesan dari Meja', desc: 'Pelanggan memindai QR di meja, memilih hidangan, dan membayar dari ponselnya sendiri.' },
  { Icon: ChefHat, title: 'Kasir & Dapur Selaras', desc: 'Setiap pesanan langsung tampil di antrean kasir dan dapur, tanpa kertas yang tercecer.' },
  { Icon: BarChart3, title: 'Buku Kas Harian', desc: 'Omzet, modal (HPP), dan laba tercatat rapi di setiap transaksi.' },
];

const STATS = [
  { value: '4 langkah', label: 'dari memilih menu hingga membayar' },
  { value: 'Seketika', label: 'pesanan sampai ke kasir & dapur' },
  { value: 'Tercatat', label: 'omzet, HPP, dan laba setiap hari' },
];

const MENUS = [
  { img: nasgorSpesialImg, name: 'Nasi Goreng Spesial', desc: 'Telur mata sapi, kerupuk udang, sambal, dan lalapan segar.', price: 'Rp 28.000', tag: 'Favorit' },
  { img: nasgorKampungImg, name: 'Nasi Goreng Kampung', desc: 'Bumbu rempah rumahan, acar segar, dan emping renyah.', price: 'Rp 25.000' },
  { img: cakeImg, name: 'Cheesecake & Latte', desc: 'Blueberry cheesecake lembut dengan secangkir latte hangat.', price: 'Rp 35.000', tag: 'Baru' },
  { img: pastryImg, name: 'Aneka Pastry Manis', desc: 'Choux krim dan buah segar, teman minum kopi sore.', price: 'Rp 18.000' },
];

const STEPS = [
  { img: heroImg, pos: 'object-[80%_50%]', Icon: ScanLine, title: 'Pindai QR di Meja', desc: 'Nomor meja terbaca otomatis; tidak perlu memanggil pelayan.' },
  { img: nasgorSpesialImg, pos: 'object-center', Icon: Utensils, title: 'Pilih Hidangan', desc: 'Lihat foto dan harga, lalu tambahkan catatan seperti “tanpa bawang”.' },
  { img: receiptImg, pos: 'object-center', Icon: Wallet, title: 'Bayar QRIS atau Tunai', desc: 'Bayar dari ponsel atau di kasir, lalu ikuti status pesanan Anda.' },
];

const ROMAN = ['I', 'II', 'III'];

function Kicker({ children, className = 'text-gold' }) {
  return (
    <p className={`flex items-center justify-center gap-3 font-script text-2xl sm:text-[1.75rem] ${className}`}>
      <span className="h-px w-8 bg-current opacity-60" aria-hidden="true" />
      {children}
      <span className="h-px w-8 bg-current opacity-60" aria-hidden="true" />
    </p>
  );
}

const btn =
  'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[13px] font-medium uppercase tracking-[0.2em] transition-colors';

export default function Landing() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-navy font-sans text-ivory/80">
      {/* ---------- Navbar ---------- */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#beranda" className="flex items-center gap-3 text-ivory">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/80">
              <ChefHat size={19} strokeWidth={1.4} className="text-gold" />
            </span>
            <span className="font-display text-2xl font-semibold tracking-[0.14em]">MICRODINE</span>
          </a>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Navigasi utama">
            {NAV.map((n, i) => (
              <a
                key={n.href}
                href={n.href}
                className={`text-[13px] font-medium uppercase tracking-[0.18em] transition-colors hover:text-gold ${
                  i === 0 ? 'text-gold' : 'text-ivory/85'
                }`}
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/login"
              className="hidden border-b border-ivory/40 pb-0.5 text-[13px] font-medium uppercase tracking-[0.18em] text-ivory/85 transition-colors hover:border-gold hover:text-gold md:inline"
            >
              Portal Karyawan
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center text-ivory md:hidden"
              aria-label={open ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={open}
            >
              {open ? <X size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="mx-4 border border-gold/30 bg-obsidian p-4 md:hidden">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-sm font-medium uppercase tracking-[0.16em] text-ivory/90"
              >
                {n.label}
              </a>
            ))}
            <Link to="/admin/login" className="block py-3 text-sm font-medium uppercase tracking-[0.16em] text-gold">
              Portal Karyawan
            </Link>
          </div>
        )}
      </header>

      {/* ---------- Hero ---------- */}
      <section id="beranda" className="relative flex min-h-[100svh] items-center overflow-hidden">
        <img
          src={heroImg}
          alt="Suasana restoran dengan kasir digital dan pelanggan memesan lewat ponsel"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-obsidian/70" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-navy" aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-16 pt-28 text-center sm:px-6">
          <Kicker>Selamat datang di restoran kami</Kicker>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.02] text-ivory sm:text-7xl lg:text-[5.5rem]">
            Pesan dengan Mudah,
            <br />
            <em className="font-medium text-gold">Dilayani dengan Cepat</em>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-ivory/85 sm:text-lg">
            Platform manajemen restoran untuk usaha kuliner Indonesia: pesan dari meja, kasir yang sigap, dan laporan
            laba yang selalu rapi.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link to="/table-selection" className={`${btn} w-full bg-crimson text-ivory hover:bg-crimson-dark sm:w-auto`}>
              Lihat Menu & Pesan <ArrowUpRight size={16} strokeWidth={1.6} />
            </Link>
            <Link
              to="/admin/login"
              className={`${btn} w-full border border-ivory/70 text-ivory hover:bg-ivory hover:text-navy sm:w-auto`}
            >
              Portal Karyawan <ArrowUpRight size={16} strokeWidth={1.6} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Fitur ---------- */}
      <section id="fitur" className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:grid-cols-3 sm:gap-10 sm:px-6">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="text-center">
              <Icon size={46} strokeWidth={1} className="mx-auto text-gold" />
              <h3 className="mt-6 font-display text-2xl font-semibold text-ivory">{title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Ornament className="mx-auto max-w-6xl px-4 sm:px-6" />

      {/* ---------- Tentang ---------- */}
      <section id="tentang" className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="font-script text-2xl text-gold sm:text-[1.75rem]">Mengapa memilih kami</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-[1.08] text-ivory sm:text-[3.25rem]">
              Restoran digital untuk <em className="font-medium text-gold">usaha kecil</em> yang ingin naik kelas
            </h2>
            <p className="mt-6 text-base leading-relaxed">
              MICRODINE membantu warung dan restoran kecil bekerja lebih tertib: pelanggan memesan sendiri, kasir tidak
              kewalahan, dan pemilik tahu persis keuntungan setiap hari, tanpa perangkat mahal.
            </p>
            <dl className="mt-10 grid border-y border-gold/30 sm:grid-cols-3">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className={`px-2 py-5 text-center lg:text-left ${i > 0 ? 'border-t border-gold/20 sm:border-l sm:border-t-0 sm:pl-5' : ''}`}
                >
                  <dt className="font-display text-2xl font-semibold text-gold">{s.value}</dt>
                  <dd className="mt-1 text-sm leading-snug text-ivory/75">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <figure className="relative col-span-2 h-56 overflow-hidden border border-gold/30 sm:h-64">
              <img src={posImg} alt="Tablet kasir di meja kasir dengan dapur di belakang" className="h-full w-full object-cover" />
              <figcaption className="absolute bottom-0 left-0 bg-navy px-4 py-2 font-script text-lg text-gold">Kasir digital</figcaption>
            </figure>
            <figure className="relative h-48 overflow-hidden border border-gold/30 sm:h-60">
              <img src={receiptImg} alt="Struk dengan QR code keluar dari printer kasir" className="h-full w-full object-cover" />
              <figcaption className="absolute bottom-0 left-0 bg-navy px-3 py-1.5 font-script text-lg text-gold">Struk & QRIS</figcaption>
            </figure>
            <figure className="relative h-48 overflow-hidden border border-gold/30 sm:h-60">
              <img src={kitchenImg} alt="Tim koki menyiapkan pesanan di dapur" className="h-full w-full object-cover" />
              <figcaption className="absolute bottom-0 left-0 bg-navy px-3 py-1.5 font-script text-lg text-gold">Dapur terhubung</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ---------- Menu Andalan (ivory) ---------- */}
      <section id="menu" className="bg-ivory py-20 text-obsidian sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <Kicker className="text-crimson">Menu andalan</Kicker>
            <h2 className="mt-3 font-display text-4xl font-semibold text-navy sm:text-[3.25rem]">Hidangan Favorit Pelanggan</h2>
            <Ornament className="mx-auto mt-6 max-w-xs" />
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {MENUS.map((m) => (
              <article key={m.name} className="flex flex-col border border-ivory-line bg-ivory-paper">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={m.img} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
                  {m.tag && (
                    <span className="absolute left-0 top-4 bg-crimson px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ivory">
                      {m.tag}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-2xl font-semibold leading-tight text-navy">{m.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-obsidian/75">{m.desc}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-ivory-line pt-4">
                    <span className="font-display text-xl font-semibold text-crimson">{m.price}</span>
                    <Link
                      to="/table-selection"
                      className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.16em] text-navy transition-colors hover:text-crimson"
                    >
                      Pesan <ArrowUpRight size={14} strokeWidth={1.6} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/table-selection" className={`${btn} border border-navy text-navy hover:bg-navy hover:text-ivory`}>
              Lihat Semua Menu <ArrowUpRight size={16} strokeWidth={1.6} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Banner Nusantara ---------- */}
      <section
        className="relative bg-cover bg-center py-28 lg:bg-fixed"
        style={{ backgroundImage: `url(${foodSpread})` }}
        aria-label="Hidangan Nusantara"
      >
        <div className="absolute inset-0 bg-navy/75" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Kicker>Rasa Nusantara</Kicker>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-ivory sm:text-[3.25rem]">
            Satu meja, banyak hidangan, <em className="font-medium text-gold">satu tagihan</em>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ivory/85">
            Setiap orang di meja dapat menambah pesanan dari ponselnya masing-masing. Semua tercatat rapi dalam satu
            tagihan meja.
          </p>
        </div>
      </section>

      {/* ---------- Cara Pesan ---------- */}
      <section id="cara-pesan" className="bg-navy-soft py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <Kicker>Cara memesan</Kicker>
            <h2 className="mt-3 font-display text-4xl font-semibold text-ivory sm:text-[3.25rem]">Cukup Tiga Langkah</h2>
          </div>
          <ol className="mt-14 grid gap-6 sm:grid-cols-3">
            {STEPS.map(({ img, pos, Icon, title, desc }, i) => (
              <li key={title} className="border border-gold/25 bg-navy">
                <div className="relative h-48 overflow-hidden">
                  <img src={img} alt="" aria-hidden="true" loading="lazy" className={`h-full w-full object-cover ${pos}`} />
                  <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-gold bg-navy">
                    <Icon size={18} strokeWidth={1.4} className="text-gold" />
                  </span>
                </div>
                <div className="p-6">
                  <p className="font-display text-3xl font-semibold text-gold">{ROMAN[i]}.</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-ivory">{title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section
        className="relative bg-cover bg-center py-24 text-center sm:py-28"
        style={{ backgroundImage: `url(${kitchenImg})` }}
      >
        <div className="absolute inset-0 bg-obsidian/80" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <Kicker>Sudah lapar?</Kicker>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-ivory sm:text-[3.25rem]">
            Pesan dari meja Anda sekarang
          </h2>
          <Link to="/table-selection" className={`${btn} mt-10 bg-crimson text-ivory hover:bg-crimson-dark`}>
            Mulai Pesan <ArrowUpRight size={16} strokeWidth={1.6} />
          </Link>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer id="kontak" className="border-t-2 border-gold/60 bg-obsidian">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-3 sm:px-6">
          <div>
            <div className="flex items-center gap-3 text-ivory">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/80">
                <ChefHat size={17} strokeWidth={1.4} className="text-gold" />
              </span>
              <span className="font-display text-xl font-semibold tracking-[0.14em]">MICRODINE</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">
              Platform manajemen restoran terpadu untuk mendorong kemandirian digital usaha kuliner Indonesia.
            </p>
          </div>
          <div>
            <h4 className="font-display text-xl font-semibold text-gold">Kontak</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3"><MapPin size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold" />Jl. Kaliurang Km 5 No. 12, Sleman, Yogyakarta</li>
              <li className="flex gap-3"><Phone size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold" />0812-3456-7890</li>
              <li className="flex gap-3"><Clock size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold" />Setiap hari, 10.00 – 22.00</li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-xl font-semibold text-gold">Akses Cepat</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link to="/table-selection" className="transition-colors hover:text-gold">Pesan dari meja</Link></li>
              <li><Link to="/admin/login" className="transition-colors hover:text-gold">Portal kasir & admin</Link></li>
              <li><a href="#cara-pesan" className="transition-colors hover:text-gold">Cara memesan</a></li>
            </ul>
          </div>
        </div>
        <p className="border-t border-ivory/10 py-6 text-center text-xs tracking-[0.14em] text-ivory/55">
          © 2026 MICRODINE · Semua hak dilindungi
        </p>
      </footer>
    </div>
  );
}
