#!/bin/bash
# ==============================================================================
# Script Restore Database Kasir dari AWS S3 / File Lokal
# ==============================================================================

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BASE_DIR}/backups"

if [ -f "${BASE_DIR}/.env" ]; then
  set -a
  source "${BASE_DIR}/.env"
  set +a
fi

DB_CONTAINER="${DB_CONTAINER:-cashier_db}"
DB_USER="${POSTGRES_USER:-cashier_user}"
DB_NAME="${POSTGRES_DB:-cashier_db}"
S3_BUCKET="${S3_BUCKET:-}"

if [ -z "$1" ]; then
  echo "Gunakan: $0 <nama_file_backup.sql.gz> ATAU ketik 'list' untuk melihat cadangan di S3"
  echo "Contoh:"
  echo "  $0 list"
  echo "  $0 cashier_cashier_db_20261004_120000.sql.gz"
  exit 1
fi

if [ "$1" == "list" ]; then
  echo "📋 Daftar backup di AWS S3 (s3://${S3_BUCKET}/backups/):"
  if command -v aws &> /dev/null; then
    aws s3 ls "s3://${S3_BUCKET}/backups/"
  else
    docker run --rm \
      -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
      -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
      -e AWS_SESSION_TOKEN="${AWS_SESSION_TOKEN}" \
      -e AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}" \
      amazon/aws-cli s3 ls "s3://${S3_BUCKET}/backups/"
  fi
  exit 0
fi

RESTORE_FILE="$1"
LOCAL_PATH="${BACKUP_DIR}/${RESTORE_FILE}"

# Jika file belum ada di lokal, unduh dari S3
if [ ! -f "${LOCAL_PATH}" ]; then
  echo "📥 Mengunduh ${RESTORE_FILE} dari S3..."
  if command -v aws &> /dev/null; then
    aws s3 cp "s3://${S3_BUCKET}/backups/${RESTORE_FILE}" "${LOCAL_PATH}"
  else
    docker run --rm \
      -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
      -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
      -e AWS_SESSION_TOKEN="${AWS_SESSION_TOKEN}" \
      -e AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}" \
      -v "${BACKUP_DIR}:/data" \
      amazon/aws-cli s3 cp "s3://${S3_BUCKET}/backups/${RESTORE_FILE}" "/data/${RESTORE_FILE}"
  fi
fi

echo "⚠️  PERINGATAN: Memulihkan database akan menimpa data yang ada di ${DB_NAME}!"
read -p "Apakah Anda yakin ingin melanjutkan? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Operasi dibatalkan."
  exit 0
fi

echo "🔄 Merekonstruksi database dari ${LOCAL_PATH}..."
gunzip -c "${LOCAL_PATH}" | docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"
echo "✅ Pemulihan database berhasil selesai!"
