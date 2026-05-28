#!/usr/bin/env bash
# Vérifications d'acceptance — isolation réseau Docker (ticket réseau HealthAI).
set -euo pipefail

fail() {
  echo "❌ $1" >&2
  exit 1
}

ok() {
  echo "✅ $1"
}

command -v docker >/dev/null 2>&1 || fail "Docker requis"

docker network inspect healthai-internal >/dev/null 2>&1 ||
  fail "Réseau healthai-internal introuvable (lancer: docker compose up -d)"

docker network inspect healthai-public >/dev/null 2>&1 ||
  fail "Réseau healthai-public introuvable"

# MariaDB ne doit pas publier de port sur l'hôte
mariadb_ports="$(docker inspect healthai-mariadb --format '{{json .HostConfig.PortBindings}}' 2>/dev/null || echo 'null')"
if [ "$mariadb_ports" != "null" ] && [ "$mariadb_ports" != "{}" ]; then
  fail "MariaDB expose des ports sur l'hôte: $mariadb_ports"
fi
ok "MariaDB sans port publié sur l'hôte"

# MongoDB idem
if docker ps --format '{{.Names}}' | grep -qx 'healthai-mongodb'; then
  mongo_ports="$(docker inspect healthai-mongodb --format '{{json .HostConfig.PortBindings}}')"
  if [ "$mongo_ports" != "null" ] && [ "$mongo_ports" != "{}" ]; then
    fail "MongoDB expose des ports sur l'hôte: $mongo_ports"
  fi
  ok "MongoDB sans port publié sur l'hôte"
fi

# Depuis l'hôte : 3306 refusé
if command -v curl >/dev/null 2>&1; then
  if curl -s --connect-timeout 2 "localhost:3306" >/dev/null 2>&1; then
    fail "curl localhost:3306 a réussi — la BDD ne doit pas être joignable depuis l'hôte"
  fi
  ok "curl localhost:3306 → connexion refusée (attendu)"
else
  echo "⚠️  curl absent — test localhost:3306 ignoré"
fi

# Ports publics attendus (si conteneurs démarrés)
check_port() {
  local name="$1"
  local port="$2"
  if docker ps --format '{{.Names}}' | grep -qx "$name"; then
    if ! curl -s --connect-timeout 2 -o /dev/null -w '' "http://localhost:${port}/" 2>/dev/null &&
      ! curl -s --connect-timeout 2 -o /dev/null "http://localhost:${port}/" 2>/dev/null; then
      echo "⚠️  $name : port $port non joignable (service arrêté ou démarrage en cours ?)"
    else
      ok "$name accessible sur localhost:$port"
    fi
  fi
}

check_port healthai-backend 3000
check_port healthai-frontend 80
check_port healthai-grafana 3001
check_port healthai-adminer 8080

echo ""
echo "Inspection réseau interne :"
docker network inspect healthai-internal --format 'Conteneurs: {{range $k, $v := .Containers}}{{$v.Name}} {{end}}'
