#!/bin/bash
# MongoDB backup script for Nexus Smart Wallet
# Usage: ./backup.sh <mongodb_uri> [output_directory]

MONGODB_URI=${1:-$MONGODB_URI}
BACKUP_PARENT_DIR=${2:-"./backups"}

if [ -z "$MONGODB_URI" ]; then
    echo "Error: MONGODB_URI must be provided as first argument or environment variable." >&2
    exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_PARENT_DIR}/mongo_${TIMESTAMP}"

mkdir -p "${BACKUP_PARENT_DIR}"

echo "📦 Starting MongoDB backup..."
echo "🔗 Destination: ${BACKUP_DIR}"

# Execute mongodump with compression
mongodump --uri="${MONGODB_URI}" --out="${BACKUP_DIR}" --gzip

if [ $? -eq 0 ]; then
    echo "✅ MongoDB backup completed successfully."
    # Create a tarball of the backup directory
    tar -czf "${BACKUP_DIR}.tar.gz" -C "${BACKUP_PARENT_DIR}" "mongo_${TIMESTAMP}"
    rm -rf "${BACKUP_DIR}"
    echo "📦 Compressed tarball created: ${BACKUP_DIR}.tar.gz"
else
    echo "❌ Error: MongoDB backup failed!" >&2
    exit 1
fi
