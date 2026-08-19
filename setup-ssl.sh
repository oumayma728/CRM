#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# CRM AI Project - SSL Setup with Let's Encrypt
# =============================================================================
# Usage: sudo ./setup-ssl.sh example.com
#
# Prerequisites:
#   - A domain name pointing to your server's public IP
#   - Port 80 and 443 accessible from the internet
#   - Certbot installed (installed automatically if missing)
# =============================================================================

if [ $# -lt 1 ]; then
    echo "Usage: sudo $0 <domain>"
    echo "Example: sudo $0 crm.monsite.com"
    exit 1
fi

DOMAIN="$1"
SSL_DIR="$(cd "$(dirname "$0")" && pwd)/ssl"
mkdir -p "$SSL_DIR"

echo "=== CRM AI - SSL Setup for $DOMAIN ==="

# Install certbot if missing
if ! command -v certbot &>/dev/null; then
    echo "[1/4] Installing certbot..."
    sudo apt update -qq
    sudo apt install -y -qq certbot
fi

# Stop any service on port 80 temporarily (standalone mode)
echo "[2/4] Stopping nginx container temporarily..."
docker compose -f "$(dirname "$0")/docker-compose.yml" stop frontend 2>/dev/null || true

# Get certificate
echo "[3/4] Requesting Let's Encrypt certificate for $DOMAIN..."
sudo certbot certonly --standalone \
    --agree-tos \
    --non-interactive \
    --email "admin@$DOMAIN" \
    -d "$DOMAIN" \
    || echo "WARN: certbot failed. Trying --register-unsafely-without-email..."
    sudo certbot certonly --standalone \
    --agree-tos \
    --non-interactive \
    --register-unsafely-without-email \
    -d "$DOMAIN" \
    || { echo "ERROR: certbot failed. Check DNS and firewall."; exit 1; }

# Copy certificates to project ssl directory
echo "[4/4] Copying certificates..."
sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/"
sudo chmod 644 "$SSL_DIR/fullchain.pem"
sudo chmod 600 "$SSL_DIR/privkey.pem"

# Restart nginx with SSL
echo "Restarting frontend with SSL..."
export DOMAIN="$DOMAIN"
docker compose -f "$(dirname "$0")/docker-compose.yml" up -d frontend

echo ""
echo "=== SUCCESS ==="
echo "  HTTPS: https://$DOMAIN"
echo ""
echo "=== Auto-renewal ==="
echo "  Certificates renew automatically via systemd timer:"
echo "  systemctl list-timers | grep certbot"
echo ""
echo "  Manual renewal test:"
echo "  sudo certbot renew --dry-run"
