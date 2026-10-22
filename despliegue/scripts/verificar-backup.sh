#!/usr/bin/env bash
# =============================================================================
# verificar-backup.sh — Demuestra que el último respaldo SE PUEDE RESTAURAR: lo carga en una base temporal
# aislada (sin puertos, 512 MB) y cuenta usuarios y tablas. No toca producción. Borra la base temporal siempre.
#
# Uso (root):  bash despliegue/scripts/verificar-backup.sh
# Variables:   DESTINO_BASE (por defecto /var/backups/sihul), BACKUP_PASSPHRASE_FILE (si las copias están cifradas)
# Cron semanal: despliegue/servidor/cron-sihul-backup. Estado: /var/log/sihul-backup/verificacion.estado
# =============================================================================
set -euo pipefail

DESTINO_BASE="${DESTINO_BASE:-/var/backups/sihul}"
PASS="${BACKUP_PASSPHRASE_FILE:-}"
LOG_DIR="${LOG_DIR:-/var/log/sihul-backup}"
mkdir -p "$LOG_DIR"
NOMBRE="sihul-verif-restore"
TMP="$(mktemp -d)"
cleanup() { docker rm -fv "$NOMBRE" >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT
fallo() { echo "FALLO $(date '+%F %T %Z') $1" | tee "$LOG_DIR/verificacion.estado" >&2; exit 1; }

ULTIMO="$(find "$DESTINO_BASE" -mindepth 1 -maxdepth 1 -type d | sort | tail -1)"
[[ -n "$ULTIMO" ]] || fallo "no hay respaldos en $DESTINO_BASE"
echo "[verificar] respaldo: $ULTIMO"

if [[ -f "$ULTIMO/db.dump" ]]; then
  cp "$ULTIMO/db.dump" "$TMP/db.dump"
elif [[ -f "$ULTIMO/db.dump.gpg" ]]; then
  [[ -n "$PASS" && -f "$PASS" ]] || fallo "copia cifrada y falta BACKUP_PASSPHRASE_FILE"
  gpg --batch --yes --pinentry-mode loopback --passphrase-file "$PASS" -o "$TMP/db.dump" -d "$ULTIMO/db.dump.gpg" || fallo "no se pudo descifrar"
else
  fallo "el respaldo no tiene db.dump"
fi
( cd "$ULTIMO" && sha256sum -c SHA256SUMS >/dev/null ) || fallo "las sumas de verificación no coinciden"

docker rm -fv "$NOMBRE" >/dev/null 2>&1 || true
docker run -d --name "$NOMBRE" --memory 512m -e POSTGRES_PASSWORD="$(head -c 12 /dev/urandom | base64)" \
  -v "$TMP:/backup:ro" pgvector/pgvector:pg16 >/dev/null
for _ in $(seq 1 30); do docker exec "$NOMBRE" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 2; done
docker exec "$NOMBRE" createdb -U postgres verificacion
docker exec "$NOMBRE" pg_restore -U postgres -d verificacion --no-owner --no-acl /backup/db.dump || fallo "pg_restore terminó con errores"

USUARIOS="$(docker exec "$NOMBRE" psql -U postgres -d verificacion -tAc 'select count(*) from usuarios_usuario')"
TABLAS="$(docker exec "$NOMBRE" psql -U postgres -d verificacion -tAc "select count(*) from information_schema.tables where table_schema='public'")"
[[ "${USUARIOS:-0}" -gt 0 ]] || fallo "la copia restaurada no tiene usuarios"
echo "OK $(date '+%F %T %Z') $(basename "$ULTIMO") usuarios=$USUARIOS tablas=$TABLAS" | tee "$LOG_DIR/verificacion.estado"
