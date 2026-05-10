#!/usr/bin/env bash

set -euo pipefail

echo "[deploy] Starting post-deploy tasks..."

if command -v composer >/dev/null 2>&1; then
  echo "[deploy] Installing/updating PHP dependencies..."
  composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
else
  echo "[deploy] composer not found on server; skipping composer install."
fi

if [ ! -L public/storage ] && [ ! -e public/storage ]; then
  echo "[deploy] Creating storage symlink..."
  php artisan storage:link || true
fi

echo "[deploy] Running database migrations..."
php artisan migrate --force

echo "[deploy] Refreshing application caches..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "[deploy] Post-deploy tasks complete."
