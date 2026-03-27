#!/bin/bash

set -e

DOMAIN="codexium.it"
EMAIL="itartashat@gmail.com"

PROJECT_ROOT="/home/codexium/codexium"
PROJECT_SSL_PATH="$PROJECT_ROOT/letsencrypt/live/$DOMAIN"
SYSTEM_SSL_PATH="/etc/letsencrypt/live/$DOMAIN"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

echo "=== Stopping nginx if running ==="
systemctl stop nginx || true
docker compose -f "$COMPOSE_FILE" down

echo "=== Running certbot ==="
certbot certonly \
  --standalone \
  -d $DOMAIN \
  -d www.$DOMAIN \
  --non-interactive \
  --agree-tos \
  --email $EMAIL

echo "=== Creating project SSL directory ==="
mkdir -p "$PROJECT_SSL_PATH"

echo "=== Copying certificates to project directory ==="
cp -f "$SYSTEM_SSL_PATH/fullchain.pem" "$PROJECT_SSL_PATH/fullchain.pem"
cp -f "$SYSTEM_SSL_PATH/privkey.pem"   "$PROJECT_SSL_PATH/privkey.pem"
cp -f "$SYSTEM_SSL_PATH/cert.pem"      "$PROJECT_SSL_PATH/cert.pem"
cp -f "$SYSTEM_SSL_PATH/chain.pem"     "$PROJECT_SSL_PATH/chain.pem"

echo "=== Restarting docker containers ==="
docker compose -f "$COMPOSE_FILE" down
docker compose -f "$COMPOSE_FILE" up -d

echo "=== Starting nginx back ==="
systemctl start nginx || true

echo "=== SSL for $DOMAIN renewed successfully ==="
