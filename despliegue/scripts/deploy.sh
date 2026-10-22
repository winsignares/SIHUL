#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Despliega una versión (etiqueta de imagen) de SIHUL, con vuelta atrás.
#
# Uso:
#   despliegue/scripts/deploy.sh <entorno> <tag> [--build]
#     entorno : prod | test                       (usa despliegue/env/<entorno>.env)
#     tag     : SHA corto del commit o etiqueta   (ej. 1a2b3c4)
#     --build : construye las imágenes en el servidor en vez de descargarlas de GHCR
#               (con 5,8 GB de RAM puede agotar la memoria: preferir descargar)
#
# Flujo (se detiene ante el primer error):
#   1. Verifica el entorno y, en prod, que exista un backup de las últimas 24 h.
#   2. Ajusta el dueño de los volúmenes de archivos (media/static) para el usuario sin root.
#   3. Obtiene las imágenes (pull o build).
#   4. Ejecuta el job "release": migraciones + collectstatic.
#   5. Levanta los servicios con la versión nueva.
#   6. Espera a que backend, chatbot y frontend estén sanos; si no, vuelve a la versión anterior.
#
# NUNCA ejecuta "down -v". Los volúmenes de datos no se tocan.
# =============================================================================
set -euo pipefail

ENTORNO="${1:-}"
TAG="${2:-}"
BUILD="${3:-}"
if [[ -z "$ENTORNO" || -z "$TAG" ]]; then
  echo "Uso: $0 <prod|test> <tag> [--build]" >&2
  exit 2
fi
[[ "$ENTORNO" == "prod" || "$ENTORNO" == "test" ]] || { echo "Entorno inválido: $ENTORNO" >&2; exit 2; }

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"          # .../despliegue
# Solo Git Bash en Windows (ensayos locales): Docker necesita rutas de Windows. En Linux no hace nada.
if command -v cygpath >/dev/null 2>&1; then RAIZ="$(cygpath -m "$RAIZ")"; fi
ENV_FILE="$RAIZ/env/${ENTORNO}.env"
COMPOSE_FILE="$RAIZ/compose/docker-compose.yml"
ESTADO="$RAIZ/.estado"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/sihul}"
ESPERA_SEGUNDOS="${ESPERA_SEGUNDOS:-240}"
mkdir -p "$ESTADO"

[[ -f "$ENV_FILE" ]] || { echo "Falta $ENV_FILE (copiar desde ${ENV_FILE}.example)" >&2; exit 1; }
[[ "$(stat -c %a "$ENV_FILE" 2>/dev/null || echo 600)" =~ ^(600|640|400)$ ]] || \
  echo "AVISO: $ENV_FILE tiene permisos amplios; ejecuta: chmod 600 $ENV_FILE" >&2

TAG_ACTIVO="$TAG"
dc() { TAG="$TAG_ACTIVO" docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }
valor_env() { grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- ; }

PROYECTO="$(valor_env COMPOSE_PROJECT_NAME)"; PROYECTO="${PROYECTO:-sihul}"

# --- 1. Verificaciones ------------------------------------------------------
if [[ "$ENTORNO" == "prod" ]]; then
  ULTIMO="$(find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mmin -1440 2>/dev/null | sort | tail -1 || true)"
  if [[ -z "$ULTIMO" ]]; then
    echo "No hay un backup de las últimas 24 h en $BACKUP_DIR." >&2
    echo "Ejecuta primero: sudo bash $RAIZ/scripts/backup.sh   (o FORZAR=1 para continuar bajo tu responsabilidad)" >&2
    [[ "${FORZAR:-0}" == "1" ]] || exit 1
  else
    echo "[deploy] Backup reciente: $ULTIMO"
  fi
fi

# --- 2. Dueño de los volúmenes de archivos (usuario 10001 de las imágenes) ---
# Solo media y static. NUNCA el volumen de la base de datos.
echo "[deploy] Ajustando permisos de los volúmenes de archivos..."
for nombre in media static; do
  v="${PROYECTO}_${nombre}"
  # Si no existe, se crea con las etiquetas de Compose (así Compose no avisa de que no lo creó él).
  docker volume inspect "$v" >/dev/null 2>&1 || docker volume create \
    --label "com.docker.compose.project=${PROYECTO}" --label "com.docker.compose.volume=${nombre}" "$v" >/dev/null
  docker run --rm -v "${v}:/datos" alpine chown -R 10001:10001 /datos
done

# --- 3. Registrar versión anterior -----------------------------------------
ANTERIOR="$(cat "$ESTADO/${ENTORNO}.tag" 2>/dev/null || true)"
echo "[deploy] entorno=$ENTORNO  proyecto=$PROYECTO  versión nueva=$TAG  anterior=${ANTERIOR:-<ninguna>}"

# --- 4. Imágenes ------------------------------------------------------------
if [[ "$BUILD" == "--build" ]]; then
  echo "[deploy] Construyendo imágenes en el servidor..."
  dc build
else
  echo "[deploy] Descargando imágenes..."
  dc pull backend chatbot frontend
fi

# --- 5. Release (migraciones + collectstatic) -------------------------------
echo "[deploy] Levantando base de datos y Redis..."
dc up -d db redis
echo "[deploy] Aplicando migraciones y collectstatic..."
dc --profile release run --rm release

# --- 6. Levantar ------------------------------------------------------------
echo "[deploy] Levantando servicios..."
dc up -d --remove-orphans backend chatbot frontend

# --- 7. Esperar salud o volver atrás ---------------------------------------
servicio_sano() {
  local cid
  cid="$(dc ps -q "$1" 2>/dev/null | head -1)"
  [[ -n "$cid" ]] && [[ "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}sin-health{{end}}' "$cid")" == "healthy" ]]
}

echo "[deploy] Esperando que los servicios estén sanos (máx. ${ESPERA_SEGUNDOS}s)..."
FIN=$((SECONDS + ESPERA_SEGUNDOS))
SANO=0
while (( SECONDS < FIN )); do
  if servicio_sano backend && servicio_sano chatbot && servicio_sano frontend; then SANO=1; break; fi
  sleep 5
done

if (( SANO == 0 )); then
  echo "[deploy] ERROR: los servicios no quedaron sanos:" >&2
  dc ps >&2
  if [[ -n "$ANTERIOR" ]]; then
    echo "[deploy] Volviendo a la versión anterior ($ANTERIOR)..." >&2
    TAG_ACTIVO="$ANTERIOR"
    dc up -d --remove-orphans backend chatbot frontend
  else
    echo "[deploy] No hay versión anterior registrada a la que volver." >&2
  fi
  exit 1
fi

[[ -n "$ANTERIOR" && "$ANTERIOR" != "$TAG" ]] && echo "$ANTERIOR" > "$ESTADO/${ENTORNO}.tag.anterior"
echo "$TAG" > "$ESTADO/${ENTORNO}.tag"
echo "[deploy] OK — $ENTORNO en $TAG"
dc ps
