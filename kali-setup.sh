#!/bin/bash
# ============================================================
#  SIMTinel — Kali Linux Setup Script (VirtualBox)
#  Run with: sudo bash kali-setup.sh
# ============================================================

set -e  # Exit immediately on any error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Colour

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   SIMTinel — Kali Linux Setup Script      ${NC}"
echo -e "${BLUE}============================================${NC}"

# ── 1. System Update ─────────────────────────────────────────
echo -e "\n${YELLOW}[1/6] Updating system packages...${NC}"
apt-get update -y && apt-get upgrade -y

# ── 2. Install Docker ────────────────────────────────────────
echo -e "\n${YELLOW}[2/6] Installing Docker...${NC}"
if command -v docker &>/dev/null; then
    echo -e "${GREEN}Docker already installed: $(docker --version)${NC}"
else
    apt-get install -y docker.io
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker installed successfully.${NC}"
fi

# ── 3. Install Docker Compose v2 ─────────────────────────────
echo -e "\n${YELLOW}[3/6] Installing Docker Compose v2 plugin...${NC}"
if docker compose version &>/dev/null; then
    echo -e "${GREEN}Docker Compose v2 already installed: $(docker compose version)${NC}"
else
    apt-get install -y docker-compose-plugin
    echo -e "${GREEN}Docker Compose v2 installed successfully.${NC}"
fi

# ── 4. Install Node.js 20 LTS ────────────────────────────────
echo -e "\n${YELLOW}[4/6] Installing Node.js 20 LTS...${NC}"
if command -v node &>/dev/null && [[ $(node -v) == v20* ]]; then
    echo -e "${GREEN}Node.js 20 already installed: $(node -v)${NC}"
else
    apt-get install -y curl
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}Node.js installed: $(node -v)${NC}"
fi

# ── 5. Install Python 3 (for update_network_ip.py) ──────────
echo -e "\n${YELLOW}[5/6] Installing Python 3...${NC}"
if command -v python3 &>/dev/null; then
    echo -e "${GREEN}Python3 already installed: $(python3 --version)${NC}"
else
    apt-get install -y python3
fi

# ── 6. Add current user to docker group ─────────────────────
echo -e "\n${YELLOW}[6/6] Adding user to docker group (no sudo needed for docker)...${NC}"
SUDO_USER_NAME="${SUDO_USER:-$USER}"
if [ "$SUDO_USER_NAME" != "root" ]; then
    usermod -aG docker "$SUDO_USER_NAME"
    echo -e "${GREEN}User '$SUDO_USER_NAME' added to docker group.${NC}"
    echo -e "${YELLOW}⚠  You need to log out and back in (or run: newgrp docker) for this to take effect.${NC}"
fi

# ── Summary ──────────────────────────────────────────────────
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ Setup Complete!                        ${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  ${BLUE}1.${NC} Make sure server/.env has your MongoDB Atlas URI"
echo -e "  ${BLUE}2.${NC} Make run.sh executable:   ${YELLOW}chmod +x run.sh${NC}"
echo -e "  ${BLUE}3.${NC} Start the project:         ${YELLOW}./run.sh${NC}"
echo -e "  ${BLUE}   OR manually:               ${YELLOW}docker compose up -d --build${NC}"
echo ""
echo -e "  ${BLUE}4.${NC} Access the app:"
echo -e "     Web Dashboard  → ${YELLOW}http://localhost${NC}  (port 80)"
echo -e "     API Server     → ${YELLOW}http://localhost:5000${NC}"
echo -e "     Ollama AI      → ${YELLOW}http://localhost:11434${NC}"
echo ""
echo -e "  ${BLUE}5.${NC} View logs:   ${YELLOW}docker compose logs -f backend${NC}"
echo -e "  ${BLUE}6.${NC} Stop:        ${YELLOW}docker compose down${NC}"
