#!/usr/bin/env bash
# Test de charge K6 — TPRE601 #146
set -euo pipefail

BASE_URL="${K6_BASE_URL:-http://host.docker.internal:3000}"
REPORT_DIR="$(cd "$(dirname "$0")/.." && pwd)/reports"
SCRIPT="$(cd "$(dirname "$0")/.." && pwd)/perf/smoke.js"

mkdir -p "${REPORT_DIR}"

echo "==> K6 smoke test — ${BASE_URL}"
docker run --rm -i \
  -e K6_BASE_URL="${BASE_URL}" \
  -v "${SCRIPT}:/scripts/smoke.js:ro" \
  -v "${REPORT_DIR}:/reports" \
  grafana/k6:latest run \
  --summary-export="/reports/k6-summary.json" \
  /scripts/smoke.js

echo "==> Rapport JSON : ${REPORT_DIR}/k6-summary.json"
