# MICRODINE · Platform Manajemen Restoran

Inovasi platform manajemen restoran terpadu untuk mendorong kemandirian digital bisnis mikro Indonesia:
pelanggan memesan sendiri dari meja (QR), kasir memproses pesanan secara real-time, dan admin memantau omzet, HPP, serta laba.

## Struktur Folder

```
cashier/
├── frontend/                  Web React + Vite + Tailwind (pelanggan, kasir, admin)
│   └── src/
│       ├── pages/
│       │   ├── Landing.jsx    Halaman awal (/)
│       │   ├── customer/      Pilih meja, katalog menu, checkout, status pesanan
│       │   └── employee/      Login karyawan, antrean kasir, riwayat, halaman admin
│       ├── components/        Komponen bersama (brand, customer, employee)
│       ├── assets/            Foto & gambar
│       └── api.js             Klien API ke kedua microservice
├── customer-microservice/     API pelanggan (Flask) · port 5001
├── employee-microservice/     API kasir & admin (Flask) · port 5002
├── database/                  Skema PostgreSQL (init.sql) & data contoh (seed.py)
├── scripts/                   Backup & restore database ke AWS S3
├── docs/
│   ├── erd/                   Diagram ERD (Markdown, Mermaid, pratinjau HTML)
│   └── superpowers/specs/     Dokumen desain & spesifikasi
├── archive/
│   └── legacy-kasir-kasbon/   Kode sistem lama Kasir & Kasbon (tidak dipakai lagi)
├── docker-compose.yml         Menjalankan db + kedua microservice + frontend
└── .env.example               Contoh variabel lingkungan
```

Setiap microservice punya `Dockerfile`, `buildspec.yml`, `appspec.yaml`, dan `taskdef.json` sendiri
untuk pipeline AWS (CodeBuild → ECR → ECS).

## Menjalankan dengan Docker

```bash
cp .env.example .env
docker compose up --build
```

| Layanan            | Alamat                   |
|--------------------|--------------------------|
| Web (frontend)     | http://localhost:3000    |
| Customer API       | http://localhost:5001    |
| Employee API       | http://localhost:5002    |
| PostgreSQL         | localhost:5432           |

## Menjalankan Manual (tanpa Docker)

```bash
# Terminal 1 – API pelanggan
cd customer-microservice && pip install -r requirements.txt && python run.py

# Terminal 2 – API kasir & admin
cd employee-microservice && pip install -r requirements.txt && python run.py

# Terminal 3 – Web
cd frontend && npm install && npm run dev
```

Tanpa `DATABASE_URL`, kedua microservice memakai SQLite lokal. Frontend meneruskan `/api/customer` ke port 5001
dan `/api/employee` ke port 5002 (bisa diubah lewat `CUSTOMER_API_URL` / `EMPLOYEE_API_URL`).

## Tes

```bash
cd customer-microservice && pytest
cd employee-microservice && pytest
```
