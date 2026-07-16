#!/bin/bash
set -e
STAMP=$(date +%Y%m%d_%H%M%S)
cd "$(dirname "$0")"

mkdir -p /root/backups
echo "--- backing up code ---"
tar czf /root/backups/ecommerce_central_code_$STAMP.tar.gz --exclude=node_modules -C /var/www ecommerce_central
echo "code backup done: /root/backups/ecommerce_central_code_$STAMP.tar.gz"

echo "--- stashing any dirty tree (excluding this script itself) ---"
git stash push -u -m "pre-deploy-stash-$STAMP" -- ':!deploy.sh' || echo "nothing to stash"

echo "--- pulling latest main ---"
git pull origin main
git log --oneline -3

echo "--- installing backend deps (in case package.json changed) ---"
cd backend && npm install --no-audit --no-fund && cd ..

echo "--- installing + building frontend (ALWAYS rebuilt, never skipped) ---"
cd frontend
npm install --no-audit --no-fund
npm run build
cd ..

echo "--- restarting backend via pm2 ---"
pm2 restart ecommerce_central

echo "--- deploy complete ---"
