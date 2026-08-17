#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# CRM AI Project - Deploy Script
# =============================================================================
# Usage:
#   First time:       ./deploy.sh
#   Update:           ./deploy.sh
#   Dry run:          ./deploy.sh --dry-run
#
# Prerequisites:
#   - Docker & Docker Compose v2 installed
#   - .env file configured (created automatically from .env.example)
#   - Backend: port 5000 (interne), Frontend: port 80 (externe)
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILES="-f ${REPO_DIR}/docker-compose.yml -f ${REPO_DIR}/docker-compose.prod.yml"
DRY_RUN="${2:-}"

# Minimum disk space in MB
MIN_DISK_MB=1024

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   CRM AI Project - Deploy Script       ${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# --------------------------------------------------
# Step 1: Check prerequisites
# --------------------------------------------------
echo -e "${YELLOW}[1/7]${NC} Checking prerequisites..."

if ! command -v docker &>/dev/null; then
    echo -e "${RED}ERROR: docker is required.${NC}"
    echo "  Install: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! docker compose version &>/dev/null; then
    echo -e "${RED}ERROR: docker compose v2 is required.${NC}"
    echo "  Install: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check disk space
AVAILABLE_MB=$(df -m "$REPO_DIR" | awk 'NR==2 {print $4}')
if [ "$AVAILABLE_MB" -lt "$MIN_DISK_MB" ]; then
    echo -e "${RED}ERROR: Insufficient disk space.${NC}"
    echo "  Available: ${AVAILABLE_MB}MB"
    echo "  Required:  ${MIN_DISK_MB}MB"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} Docker $(docker --version)"
echo -e "  ${GREEN}✓${NC} Compose $(docker compose version --short)"
echo -e "  ${GREEN}✓${NC} Disk space: ${AVAILABLE_MB}MB available"

# --------------------------------------------------
# Step 2: Pull latest code
# --------------------------------------------------
if git -C "$REPO_DIR" rev-parse --git-dir &>/dev/null 2>&1; then
    echo -e "${YELLOW}[2/7]${NC} Pulling latest code..."
    git -C "$REPO_DIR" pull --rebase
    echo -e "  ${GREEN}✓${NC} Repository updated"
else
    echo -e "${YELLOW}[2/7]${NC} Not a git repository, skipping pull."
fi

# --------------------------------------------------
# Step 3: Validate .env
# --------------------------------------------------
echo -e "${YELLOW}[3/7]${NC} Checking .env file..."
if [ ! -f "${REPO_DIR}/.env" ]; then
    if [ -f "${REPO_DIR}/.env.example" ]; then
        cp "${REPO_DIR}/.env.example" "${REPO_DIR}/.env"
        echo -e "  ${RED}✗${NC} .env created from .env.example"
        echo -e "  ${YELLOW}⚠${NC} Edit it with your secrets before deploying!"
        echo "  ${EDITOR:-nano} ${REPO_DIR}/.env"
        exit 1
    else
        echo -e "${RED}ERROR: No .env or .env.example found.${NC}"
        exit 1
    fi
fi

# Validate required variables
set +u
source "${REPO_DIR}/.env"
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "changer_ici_une_cle_secrete_longue_et_aleatoire" ]; then
    echo -e "  ${YELLOW}⚠${NC} WARNING: JWT_SECRET is not set or still has default value!"
fi
set -u
echo -e "  ${GREEN}✓${NC} .env file found"

# --------------------------------------------------
# Step 4: Validate docker-compose config
# --------------------------------------------------
echo -e "${YELLOW}[4/7]${NC} Validating docker-compose configuration..."
docker compose $COMPOSE_FILES config --quiet 2>&1 || {
    echo -e "${RED}ERROR: Invalid docker-compose configuration.${NC}"
    docker compose $COMPOSE_FILES config 2>&1
    exit 1
}
echo -e "  ${GREEN}✓${NC} Configuration valid"

# --------------------------------------------------
# Step 5: Build images
# --------------------------------------------------
echo -e "${YELLOW}[5/7]${NC} Building images..."
if [ "$DRY_RUN" = "--dry-run" ]; then
    echo -e "  ${YELLOW}⚠${NC} Dry-run: build skipped"
else
    docker compose $COMPOSE_FILES build --pull --no-cache 2>&1 | tail -5 || {
        echo -e "${RED}ERROR: Build failed.${NC}"
        exit 1
    }
    echo -e "  ${GREEN}✓${NC} Images built"
fi

# --------------------------------------------------
# Step 6: Cleanup unused images
# --------------------------------------------------
echo -e "${YELLOW}[6/7]${NC} Cleaning up..."
if [ "$DRY_RUN" = "--dry-run" ]; then
    echo -e "  ${YELLOW}⚠${NC} Dry-run: cleanup skipped"
else
    # Remove dangling images
    docker image prune -f 2>/dev/null || true
    # Remove old unused images (keep last 24h)
    docker image prune -a --filter "until=24h" -f 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Unused images cleaned"
fi

# --------------------------------------------------
# Step 7: Deploy
# --------------------------------------------------
if [ "$DRY_RUN" = "--dry-run" ]; then
    echo -e "${YELLOW}[7/7]${NC} Dry-run complete. Run without --dry-run to deploy."
    exit 0
fi

echo -e "${YELLOW}[7/7]${NC} Starting services..."
docker compose $COMPOSE_FILES up -d --remove-orphans 2>&1 | tail -10 || {
    echo -e "${RED}ERROR: Failed to start services.${NC}"
    docker compose $COMPOSE_FILES logs --tail=20
    exit 1
}

# --------------------------------------------------
# Health check
# --------------------------------------------------
echo ""
echo -e "${CYAN}=== Health Check ===${NC}"
echo -n "Waiting for services"
for i in $(seq 1 12); do
    HEALTHY=$(docker compose $COMPOSE_FILES ps --status healthy -q 2>/dev/null | wc -l)
    TOTAL=$(docker compose $COMPOSE_FILES ps -q 2>/dev/null | wc -l)
    if [ "$HEALTHY" -ge "$TOTAL" ] 2>/dev/null; then
        break
    fi
    echo -n "."
    sleep 5
done
echo ""

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "          ${GREEN}Service Status${NC}"
echo -e "${CYAN}========================================${NC}"
docker compose $COMPOSE_FILES ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Final health verification
UNHEALTHY=$(docker compose $COMPOSE_FILES ps --filter "status=unhealthy" -q 2>/dev/null | wc -l)
if [ "$UNHEALTHY" -gt 0 ]; then
    echo ""
    echo -e "  ${YELLOW}⚠${NC} Some services are unhealthy. Check logs:"
    echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=50"
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "  ${GREEN}✓${NC} Deployment complete!"
echo ""
echo "  Access:"
echo "    Frontend : http://$(curl -s ifconfig.me 2>/dev/null || echo 'localhost')"
echo "    Health   : http://localhost/api/health"
if docker compose $COMPOSE_FILES ps | grep -q uptime-kuma; then
    echo "    Monitoring: http://localhost:3001"
fi
echo ""
echo "  Commands:"
echo "    Logs     : docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo "    Status   : docker compose -f docker-compose.yml -f docker-compose.prod.yml ps"
echo "    Restart  : docker compose -f docker-compose.yml -f docker-compose.prod.yml restart"
echo "    Stop     : docker compose -f docker-compose.yml -f docker-compose.prod.yml down"
echo "    Backup   : ./backup.sh"
echo "    Restore  : ./restore.sh backups/<file>"
echo -e "${CYAN}========================================${NC}"
