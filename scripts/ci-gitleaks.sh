#!/usr/bin/env bash
# Scan secrets en CI via le binaire Gitleaks (MIT), sans gitleaks-action (licence org).
set -euo pipefail

GITLEAKS_VERSION="${GITLEAKS_VERSION:-8.30.1}"
ARCH="${GITLEAKS_ARCH:-linux_x64}"
URL="https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_${ARCH}.tar.gz"

curl -sSL "$URL" | tar -xz gitleaks
chmod +x gitleaks
./gitleaks version
./gitleaks git --config .gitleaks.toml --verbose --redact
