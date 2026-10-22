#!/usr/bin/env bash
# =============================================================================
# deploy-ci.sh — Punto de entrada del despliegue AUTOMÁTICO a producción (lo invoca el runner de GitHub).
#
# Se instala COMO COPIA propiedad de root, fuera del repositorio, para que ni un `git pull` ni el usuario del
# runner puedan modificarla:
#   install -m 750 -o root -g root despliegue/scripts/deploy-ci.sh /usr/local/sbin/sihul-deploy-ci
# El usuario del runner solo puede ejecutar ESA ruta con sudo (despliegue/servidor/sudoers-sihul-runner).
#
# Uso:  sihul-deploy-ci <sha>      (7 a 40 caracteres hexadecimales)
#
# Garantías antes de tocar nada:
#   - el commit debe ser exactamente la punta de origin/main (no se despliega nada viejo ni de otra rama);
#   - no se despliega durante la ETL (05:00–06:45 UTC) ni mientras corre;
#   - las tres imágenes de ese commit deben existir y descargarse;
#   - se hace un respaldo nuevo (deploy.sh prod lo exige);
#   - un solo despliegue a la vez (candado).
# Después usa deploy.sh, que espera a que todo esté sano y vuelve a la versión anterior si no lo está.
# =============================================================================
set -euo pipefail

REPO="${SIHUL_REPO:-/opt/sihul-repo}"
LOG_DIR="/var/log/sihul-deploy"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

[[ $# -eq 1 && "$1" =~ ^[0-9a-f]{7,40}$ ]] || { echo "Uso: $0 <sha-hexadecimal>" >&2; exit 2; }
SOLICITADO="$1"

exec 8>/var/lock/sihul-deploy.lock
flock -n 8 || { echo "Ya hay un despliegue en curso." >&2; exit 75; }

echo "=== $(date '+%F %T %Z') despliegue automático solicitado: $SOLICITADO"
cd "$REPO"
git fetch -q origin main
PUNTA="$(git rev-parse origin/main)"
COMPLETO="$(git rev-parse --verify "${SOLICITADO}^{commit}" 2>/dev/null || true)"
if [[ -z "$COMPLETO" || "$COMPLETO" != "$PUNTA" ]]; then
  echo "ERROR: $SOLICITADO no es la punta actual de origin/main (${PUNTA:0:7}). No se despliega." >&2
  exit 1
fi
TAG="${PUNTA:0:7}"

# Ventana de la ETL (cron 05:00 UTC, ~100 min).
HORA="$(date -u +%H%M)"
if (( 10#$HORA >= 500 && 10#$HORA < 645 )) || pgrep -f run_etl_completo >/dev/null; then
  echo "ERROR: ventana de la ETL (05:00–06:45 UTC) o ETL en curso. Reintentar después." >&2
  exit 75
fi

echo "--- comprobando imágenes $TAG"
for s in backend chatbot frontend; do
  docker pull -q "ghcr.io/winsignares/sihul-$s:$TAG" >/dev/null || { echo "ERROR: falta la imagen sihul-$s:$TAG" >&2; exit 1; }
done

git checkout -q main
git merge --ff-only -q origin/main

CONFIG="${SIHUL_BACKUP_ENV:-/etc/sihul/backup.env}"
if [[ -f "$CONFIG" ]]; then set -a; . "$CONFIG"; set +a; fi
echo "--- respaldo previo"
bash despliegue/scripts/backup.sh
echo "--- desplegando $TAG"
bash despliegue/scripts/deploy.sh prod "$TAG"
echo "=== $(date '+%F %T %Z') despliegue terminado: prod en $TAG"
