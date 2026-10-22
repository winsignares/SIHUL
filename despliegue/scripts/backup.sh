#!/usr/bin/env bash
# =============================================================================
# backup.sh — Respaldo verificable de SIHUL (funciona con el despliegue actual y con el nuevo).
#
# Respalda: base de datos (pg_dump formato custom), archivos subidos (volumen media) y
# configuración (nginx, /etc/sihul, .env de despliegue). No detiene servicios y no borra nada,
# salvo respaldos propios anteriores al periodo de retención.
#
# Uso (como root):
#   bash despliegue/scripts/backup.sh
#   PROYECTO=sihul RETENCION_DIAS=14 bash despliegue/scripts/backup.sh
#
# Variables opcionales:
#   PROYECTO              proyecto Compose (por defecto sihul): localiza la base por etiquetas
#   DESTINO_BASE          carpeta local (por defecto /var/backups/sihul)
#   RETENCION_DIAS        días que se conservan en la VM (por defecto 14)
#   DESTINO_RED           carpeta compartida YA MONTADA donde copiar (p. ej. /mnt/sihul-respaldos)
#   RETENCION_RED_DIAS    días que se conservan en la carpeta compartida (por defecto 30)
#   BACKUP_PASSPHRASE_FILE  archivo (permisos 600) con la clave para CIFRAR cada copia con gpg.
#                         Recomendado: las copias contienen datos personales.
#   RUTAS_CONFIG          rutas a incluir en la copia de configuración
# =============================================================================
set -euo pipefail

PROYECTO="${PROYECTO:-sihul}"
DESTINO_BASE="${DESTINO_BASE:-/var/backups/sihul}"
RETENCION_DIAS="${RETENCION_DIAS:-14}"
RETENCION_RED_DIAS="${RETENCION_RED_DIAS:-30}"
DESTINO_RED="${DESTINO_RED:-}"
BACKUP_PASSPHRASE_FILE="${BACKUP_PASSPHRASE_FILE:-}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUTAS_CONFIG="${RUTAS_CONFIG:-/etc/nginx /etc/sihul /opt/sihul $RAIZ/env}"

FECHA="$(date +%Y%m%d-%H%M%S)"
DESTINO="${DESTINO_BASE}/${FECHA}"
umask 077
mkdir -p "$DESTINO"
echo "[backup] Destino local: $DESTINO"

# ---- 1. Base de datos --------------------------------------------------------
DB_CID="$(docker ps -q --filter "label=com.docker.compose.project=${PROYECTO}" --filter "label=com.docker.compose.service=db" | head -1)"
[[ -n "$DB_CID" ]] || { echo "[backup] ERROR: no encuentro el contenedor de la base (proyecto ${PROYECTO})" >&2; exit 1; }
echo "[backup] 1/3 PostgreSQL (contenedor ${DB_CID:0:12})..."
docker exec "$DB_CID" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$DESTINO/db.dump"
# Verificación: el dump debe poder listarse y no estar vacío.
if ! docker exec -i "$DB_CID" pg_restore --list < "$DESTINO/db.dump" > "$DESTINO/db.lista.txt"; then
  echo "[backup] ERROR: el dump de la base no es válido" >&2
  exit 1
fi
echo "[backup]    objetos en el dump: $(wc -l < "$DESTINO/db.lista.txt")  tamaño: $(du -h "$DESTINO/db.dump" | cut -f1)"

# ---- 2. Archivos subidos (media) ---------------------------------------------
echo "[backup] 2/3 Volumen ${PROYECTO}_media..."
if docker volume inspect "${PROYECTO}_media" >/dev/null 2>&1; then
  docker run --rm -v "${PROYECTO}_media:/datos:ro" -v "$DESTINO:/salida" alpine \
    tar czf /salida/media.tar.gz -C /datos .
else
  echo "[backup]    (volumen no encontrado, se omite)"
fi

# ---- 3. Configuración --------------------------------------------------------
echo "[backup] 3/3 Configuración..."
LISTA=()
for ruta in $RUTAS_CONFIG; do [ -e "$ruta" ] && LISTA+=("$ruta"); done
if [ "${#LISTA[@]}" -gt 0 ]; then
  tar czf "$DESTINO/config.tar.gz" "${LISTA[@]}" 2>/dev/null || true
fi

# ---- Cifrado (opcional pero recomendado) -------------------------------------
if [[ -n "$BACKUP_PASSPHRASE_FILE" ]]; then
  [[ -f "$BACKUP_PASSPHRASE_FILE" ]] || { echo "[backup] ERROR: no existe $BACKUP_PASSPHRASE_FILE" >&2; exit 1; }
  echo "[backup] Cifrando copias..."
  for f in "$DESTINO"/db.dump "$DESTINO"/media.tar.gz "$DESTINO"/config.tar.gz; do
    [ -f "$f" ] || continue
    gpg --batch --yes --pinentry-mode loopback --passphrase-file "$BACKUP_PASSPHRASE_FILE" \
        --symmetric --cipher-algo AES256 -o "${f}.gpg" "$f"
    rm -f "$f"
  done
else
  echo "[backup] AVISO: copias SIN cifrar. Define BACKUP_PASSPHRASE_FILE antes de enviarlas fuera de la VM." >&2
fi

( cd "$DESTINO" && sha256sum ./* > SHA256SUMS )
chmod -R go-rwx "$DESTINO"

# ---- Copia a la carpeta compartida -------------------------------------------
if [[ -n "$DESTINO_RED" ]]; then
  if ! mountpoint -q "$DESTINO_RED" 2>/dev/null && [ ! -d "$DESTINO_RED" ]; then
    echo "[backup] ERROR: $DESTINO_RED no está montada" >&2; exit 1
  fi
  echo "[backup] Copiando a la carpeta compartida: $DESTINO_RED/$FECHA"
  mkdir -p "$DESTINO_RED/$FECHA"
  cp -r "$DESTINO"/. "$DESTINO_RED/$FECHA"/
  ( cd "$DESTINO_RED/$FECHA" && sha256sum -c SHA256SUMS >/dev/null ) \
    && echo "[backup]    copia verificada en la carpeta compartida" \
    || { echo "[backup] ERROR: la copia en la carpeta compartida no coincide" >&2; exit 1; }
  find "$DESTINO_RED" -mindepth 1 -maxdepth 1 -type d -mtime +"$RETENCION_RED_DIAS" -exec rm -rf {} +
else
  echo "[backup] AVISO: sin DESTINO_RED; la copia queda solo en esta VM (no protege ante su falla)." >&2
fi

echo "[backup] Limpieza de copias locales con más de ${RETENCION_DIAS} días"
find "$DESTINO_BASE" -mindepth 1 -maxdepth 1 -type d -mtime +"$RETENCION_DIAS" -exec rm -rf {} +

echo "[backup] LISTO:"
ls -lh "$DESTINO"
echo "[backup] Restauración de prueba (en una base de pruebas, no en producción):"
echo "         pg_restore -d <base_destino> --clean --if-exists <db.dump descifrado>"
