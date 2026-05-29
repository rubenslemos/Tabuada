#!/usr/bin/env bash
set -euo pipefail

# 1) Install caddy (Arch/CachyOS)
sudo pacman -Sy --noconfirm caddy

# 2) Install config
sudo mkdir -p /etc/caddy
sudo cp /home/rubens/.config/caddy/Caddyfile /etc/caddy/Caddyfile

# 3) Enable caddy service
sudo systemctl enable --now caddy

# 4) Status and quick check
sudo systemctl status caddy --no-pager | sed -n '1,22p'
curl -I https://tabuada.duckdns.org | sed -n '1,8p'
