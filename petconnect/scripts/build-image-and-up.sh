#!/usr/bin/env bash
set -euo pipefail

SKIP_BUILD=false
if [[ "${1:-}" == "--skip-build" ]]; then
  SKIP_BUILD=true
fi

# Ensure we are in script directory's repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

# Check npm availability
if command -v npm >/dev/null 2>&1; then
  NPM_CMD="npm"
else
  echo "Error: 'npm' not found. Install Node.js/npm or run from environment with npm available." >&2
  exit 2
fi

if ! $SKIP_BUILD; then
  echo "Installing dependencies..."
  $NPM_CMD ci --legacy-peer-deps

  echo "Building frontend (production)..."
  $NPM_CMD run build -- --configuration=production
else
  echo "Skipping build as requested"
fi

echo "Building Docker image petconnect-frontend:latest"
docker build -t petconnect-frontend:latest .

echo "Starting frontend with docker-compose..."
docker-compose up -d

echo "Done. Use 'docker-compose logs -f frontend' to follow logs."
