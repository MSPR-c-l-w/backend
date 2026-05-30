#!/usr/bin/env bash
# Scan Trivy de l'image Docker backend — TPRE601 #146
set -euo pipefail

IMAGE_NAME="${TRIVY_IMAGE:-mspr-backend:trivy-scan}"
REPORT_DIR="$(cd "$(dirname "$0")/.." && pwd)/reports"
REPORT_JSON="${REPORT_DIR}/trivy-report.json"

echo "==> Build image ${IMAGE_NAME}"
docker build -t "${IMAGE_NAME}" "$(cd "$(dirname "$0")/../../.." && pwd)"

mkdir -p "${REPORT_DIR}"

echo "==> Scan Trivy (CRITICAL, HIGH, MEDIUM)"
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "${REPORT_DIR}:/reports" \
  aquasec/trivy:latest image \
  --severity CRITICAL,HIGH,MEDIUM \
  --format json \
  --output "/reports/trivy-report.json" \
  "${IMAGE_NAME}"

echo "==> Résumé"
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image \
  --severity CRITICAL,HIGH,MEDIUM \
  "${IMAGE_NAME}"

echo "==> Rapport JSON : ${REPORT_JSON}"
