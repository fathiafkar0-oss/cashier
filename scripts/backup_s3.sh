#!/bin/bash
# ==============================================================================
# Script Backup Otomatis Database Kasir ke AWS S3 (Hybrid Cloud Setup)
# ==============================================================================

set -e

# Konfigurasi Direktori
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BASE_DIR}/backups"
mkdir -p "${BACKUP_DIR}"

# Muat variabel dari .env jika ada
if [ -f "${BASE_DIR}/.env" ]; then
  # export variables from .env
  set -a
  source "${BASE_DIR}/.env"
  set +a
fi

# Konfigurasi Default
DB_CONTAINER="${DB_CONTAINER:-cashier_db}"
DB_USER="${POSTGRES_USER:-cashier_user}"
DB_NAME="${POSTGRES_DB:-cashier_db}"
S3_BUCKET="${S3_BUCKET:-}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="cashier_${DB_NAME}_${TIMESTAMP}.sql.gz"
BACKUP_FILEPATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

echo "=================================================="
echo "🕒 Mulai Proses Backup: $(date)"
echo "=================================================="

# 1. Periksa apakah container database berjalan
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "❌ Error: Container ${DB_CONTAINER} tidak sedang berjalan!"
  exit 1
fi

# 2. Dump database dan kompres dengan gzip
echo "📦 1. Mengekstrak dan mengompres database (${DB_NAME})..."
docker exec -t "${DB_CONTAINER}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILEPATH}"

BACKUP_SIZE=$(du -h "${BACKUP_FILEPATH}" | cut -f1)
echo "✅ Database berhasil di-dump: ${BACKUP_FILENAME} (Ukuran: ${BACKUP_SIZE})"

# 3. Unggah ke AWS S3 jika S3_BUCKET dikonfigurasi
if [ -n "${S3_BUCKET}" ]; then
  echo "☁️  2. Mengunggah ke AWS S3: s3://${S3_BUCKET}/backups/${BACKUP_FILENAME}..."
  
  if command -v aws &> /dev/null; then
    aws s3 cp "${BACKUP_FILEPATH}" "s3://${S3_BUCKET}/backups/${BACKUP_FILENAME}"
    echo "✅ Berhasil diunggah ke AWS S3!"
  else
    echo "⚠️  AWS CLI tidak terpasang di host Lubuntu."
    echo "   Menjalankan uploader via Docker AWS CLI..."
    docker run --rm \
      -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
      -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
      -e AWS_SESSION_TOKEN="${AWS_SESSION_TOKEN}" \
      -e AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}" \
      -v "${BACKUP_DIR}:/data" \
      amazon/aws-cli s3 cp "/data/${BACKUP_FILENAME}" "s3://${S3_BUCKET}/backups/${BACKUP_FILENAME}"
    echo "✅ Berhasil diunggah ke AWS S3 via container amazon/aws-cli!"
  fi
else
  echo "ℹ️  Variabel S3_BUCKET belum diisi di .env. File hanya disimpan lokal di ${BACKUP_FILEPATH}"
fi

# 4. Rotasi Backup Lokal: Hapus backup lokal yang lebih lama dari 7 hari
echo "🧹 3. Membersihkan backup lokal yang lebih dari 7 hari..."
find "${BACKUP_DIR}" -name "cashier_*.sql.gz" -type f -mtime +7 -delete

echo "=================================================="
echo "🎉 Selesai dengan sukses pada $(date)"
echo "=================================================="
