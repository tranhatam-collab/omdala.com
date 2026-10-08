#!/bin/bash
# OMDALA Infra Bootstrap (P0)
# One-command server setup for infra.omdala.com
# Usage: ./scripts/bootstrap.sh --domain infra.omdala.com --email admin@omdala.com

set -euo pipefail

DOMAIN=""
EMAIL=""
SKIP_DOCKER=false

usage() {
  echo "Usage: $0 --domain <domain> --email <email> [--skip-docker]"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --domain) DOMAIN="$2"; shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --skip-docker) SKIP_DOCKER=true; shift ;;
    *) usage ;;
  esac
done

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  usage
fi

echo "=== OMDALA Infra Bootstrap ==="
echo "Domain: $DOMAIN"
echo "Email:  $EMAIL"
echo ""

# 1. Update system
echo "[1/7] Updating system packages..."
if command -v apt-get &> /dev/null; then
  sudo apt-get update -qq && sudo apt-get upgrade -y -qq
elif command -v apk &> /dev/null; then
  sudo apk update && sudo apk upgrade
fi

# 2. Install Docker + Compose
echo "[2/7] Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  echo "Docker installed. You may need to log out and back in."
else
  echo "Docker already installed."
fi

if ! docker compose version &> /dev/null; then
  echo "Docker Compose plugin not found. Please ensure Docker Engine >= 20.10."
  exit 1
fi

# 3. Firewall (UFW)
echo "[3/7] Configuring firewall..."
if command -v ufw &> /dev/null; then
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow 22/tcp   # SSH
  sudo ufw allow 80/tcp   # HTTP
  sudo ufw allow 443/tcp  # HTTPS
  sudo ufw --force enable
  echo "UFW enabled: 22, 80, 443 allowed."
fi

# 4. Time sync
echo "[4/7] Enabling NTP..."
sudo timedatectl set-ntp true || true

# 5. Create directories
echo "[5/7] Creating directories..."
mkdir -p infra/{caddy,postgres/init-scripts,valkey,minio,backup,monitoring,docs}
mkdir -p infra/services/{api-gateway,worker,agent-control-plane,admin-console}
mkdir -p infra/scripts

# 6. Copy env template
echo "[6/7] Preparing environment..."
if [[ ! -f .env ]]; then
  cp infra/.env.example .env
  echo ".env created from .env.example. EDIT IT with real secrets from Vault."
fi

# 7. Health check
echo "[7/7] Verifying setup..."
docker --version
docker compose version

echo ""
echo "=== Bootstrap Complete ==="
echo "Next steps:"
echo "  1. Edit .env with real secrets (from Vault, NEVER git)"
echo "  2. Run: docker compose up -d"
echo "  3. Verify: ./scripts/health-check.sh"
echo "  4. Test backup: ./scripts/backup-now.sh"
echo ""
