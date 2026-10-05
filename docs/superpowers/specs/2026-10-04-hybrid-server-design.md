# Desain Arsitektur Hybrid Server: Local-First Cashier POS dengan AWS Edge & S3 Vault

**Tanggal:** 2026-10-04  
**Status:** Approved by User  
**Tujuan:** Mengintegrasikan sistem Kasir Retail on-premise (Homeserver) dengan cloud infrastructure (AWS Academy Learner Lab, budget $50) dalam arsitektur hybrid yang tangguh terhadap batasan sesi 4 jam AWS Lab.

---

## 1. Latar Belakang & Batasan Sistem

1. **Homeserver (On-Premise):**
   - OS: Linux Ubuntu Server dengan Docker & Docker Compose.
   - Jaringan: Internet rumahan standar di balik CGNAT (tanpa IP publik statis dan tanpa port forwarding router).
   - Peran: *Single Source of Truth* untuk operasional kasir ritel (PostgreSQL, Backend API, Frontend).
2. **AWS Academy Learner Lab:**
   - Budget: $50 USD.
   - Batasan Sesi: Sesi lab maksimal 4 jam sebelum status lab *Stopped* (EC2 instances otomatis mati, namun disk EBS dan bucket S3 persisten).
   - IP Publik EC2: Berubah setiap kali lab di-*Start* ulang.
   - Peran: Cloud Edge Reverse Proxy & Off-site Backup Vault.

---

## 2. Arsitektur Topologi & Jaringan

```
[ Toko Fisik / LAN Lokal ]
  ├── Perangkat Kasir (Tablet / PC Kasir)
  └── Homeserver (Ubuntu Server 24/7)
        ├── Docker: cashier_db (PostgreSQL 15)
        ├── Docker: cashier_backend (API Port 5000)
        ├── Docker: cashier_frontend (Web Port 3000)
        ├── Docker: backup_runner (Cron S3 Uploader)


        
        └── Host: Tailscale Daemon (Node: 'pos-home')
               │
               ▼ (Encrypted WireGuard Mesh VPN via CGNAT)
               ▲
[ AWS Cloud (Learner Lab) ]
  ├── S3 Bucket: cashier-backup-vault (Offsite Snapshot Storage)
  └── EC2 Instance (t3.micro - Ubuntu)
        ├── Host: Tailscale Daemon (Node: 'pos-edge')
        └── Service: Caddy / Nginx Reverse Proxy
               ▲
               │ (HTTP / HTTPS)
[ Remote User / Owner di Luar Rumah ]
```

---

## 3. Komponen & Layanan yang Dikonfigurasi

### A. AWS Cloud Setup
1. **Amazon S3 (`cashier-backup-vault-<user-id>`):**
   - Bucket privat (Block All Public Access: ON).
   - Menyimpan backup terkompresi `backup_YYYY-MM-DD.sql.gz`.
2. **Amazon EC2 (`pos-edge`):**
   - Instance Type: `t3.micro` (1 vCPU, 1 GB RAM, ~\$0.0104/jam).
   - AMI: Ubuntu 24.04 LTS / 22.04 LTS.
   - Security Group: Inbound Port 22 (SSH), Port 80 (HTTP), Port 443 (HTTPS).
   - Layanan: Reverse proxy (Caddy / Nginx) untuk meneruskan request publik ke IP Tailscale Homeserver.
3. **AWS Credentials:**
   - Diambil dari tombol "AWS Details" di Vocareum Learner Lab untuk dimasukkan ke script backup homeserver.

### B. Interkoneksi (Tailscale Mesh Network)
1. Menghubungkan Homeserver dan EC2 tanpa port forwarding dan menembus CGNAT.
2. Menggunakan Auth Key Reusable agar node terhubung otomatis saat boot/start.
3. Alamat IP mesh tetap (100.x.y.z) memastikan EC2 selalu bisa menjangkau Homeserver meskipun IP publik EC2 berganti-ganti tiap sesi lab.

### C. Homeserver Setup
1. Menjalankan stack POS utama (`cashier_db`, `cashier_backend`, `cashier_frontend`).
2. Menjalankan service backup otomatis berkala (dump database -> kompresi gzip -> upload ke S3).

---

## 4. Alur Kerja & Ketahanan (Resilience)

1. **Operasional Harian Kasir:**
   - 100% lokal di LAN (`http://192.168.x.x:3000`).
   - Tidak terpengaruh jika internet mati atau sesi lab AWS mati.
2. **Akses Jarak Jauh (Remote Access):**
   - Saat lab aktif: Owner dapat mengakses dashboard kasir via IP publik EC2 AWS.
   - Saat lab mati: Owner tetap dapat mengakses kasir via Tailscale langsung dari smartphone/laptop.
3. **Penyimpanan Cadangan (Disaster Recovery):**
   - Snapshot database tersimpan aman di S3 AWS. S3 tidak terhapus saat sesi lab di-stop.

---

## 5. Rencana Pengujian & Validasi

1. **Uji Konektivitas Mesh:** Ping antar IP Tailscale dari EC2 ke Homeserver dan sebaliknya.
2. **Uji Reverse Proxy:** Akses IP publik EC2 di browser dan pastikan halaman frontend kasir homeserver muncul.
3. **Uji S3 Backup:** Eksekusi script backup di homeserver dan verifikasi file `.sql.gz` muncul di bucket S3 AWS Console.
4. **Uji Lab Restart:** Simulasikan Stop Lab dan Start Lab; verifikasi bahwa Tailscale dan proxy otomatis reconnect tanpa konfigurasi ulang manual.
