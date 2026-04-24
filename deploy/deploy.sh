#!/usr/bin/env bash
# FlipOS deployment script for Hetzner VPS
# Usage: ./deploy/deploy.sh <server-user>@<server-ip>
# Example: ./deploy/deploy.sh root@95.217.x.x

set -e

SERVER="${1:-root@hill.work}"
REMOTE_DIR="/var/www/peskett"
APP_NAME="flipos"

echo "==> Building locally..."
npm run build

echo "==> Copying standalone bundle to $SERVER:$REMOTE_DIR"
ssh "$SERVER" "mkdir -p $REMOTE_DIR"

# Sync the standalone build
rsync -avz --delete \
  .next/standalone/ \
  "$SERVER:$REMOTE_DIR/"

# Sync public folder (static assets)
rsync -avz --delete \
  .next/static/ \
  "$SERVER:$REMOTE_DIR/.next/static/"

rsync -avz \
  public/ \
  "$SERVER:$REMOTE_DIR/public/"

# Copy PM2 ecosystem config
scp deploy/ecosystem.config.js "$SERVER:$REMOTE_DIR/ecosystem.config.js"

echo "==> Restarting PM2 process on server..."
ssh "$SERVER" "cd $REMOTE_DIR && pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js"
ssh "$SERVER" "pm2 save"

echo "==> Deployment complete!"
echo "    Live at: https://hill.work/peskett"
