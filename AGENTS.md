# Project: MICRODINE · Platform Manajemen Restoran

Ini adalah dokumen aturan dan panduan pengembangan untuk AI agent (Antigravity) yang bekerja pada proyek ini.

## Aturan Utama (Hard Rules)
1. **Brainstorming & Planning Gate**: Sebelum menulis kode atau melakukan implementasi apa pun, diskusikan desain terlebih dahulu dan dapatkan persetujuan eksplisit dari user (selaras dengan `.agents/skills/brainstorming/SKILL.md`).
2. **Modular & Clean Code**: Pisahkan logika bisnis dengan presentasi/UI. Buat unit-unit kode kecil yang mudah diuji secara independen.
3. **Bahasa Komunikasi**: Gunakan bahasa Indonesia dalam interaksi dengan user, kecuali diminta lain.

## Cakupan Proyek (Project Scope)
- **Pelanggan (self-ordering)**: pilih meja / scan QR, katalog menu, keranjang, checkout QRIS/tunai, status pesanan.
- **Kasir (POS)**: antrean pesanan real-time, konfirmasi pembayaran tunai/QRIS, manajemen meja.
- **Admin (back-office)**: dashboard keuangan (omzet, HPP, laba), manajemen menu & HPP, laporan transaksi, target, pengaturan.

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS (`frontend/`).
- **Backend**: dua microservice Flask + SQLAlchemy — `customer-microservice/` (port 5001) dan `employee-microservice/` (port 5002).
- **Database**: PostgreSQL (`database/init.sql`), SQLite untuk pengembangan lokal.
- **Infrastruktur**: Docker Compose; AWS CodeBuild → ECR → ECS (lihat `buildspec.yml` di tiap microservice).

## Struktur Folder
Lihat `README.md`. Kode sistem lama Kasir & Kasbon disimpan di `archive/legacy-kasir-kasbon/` dan tidak dipakai lagi.
