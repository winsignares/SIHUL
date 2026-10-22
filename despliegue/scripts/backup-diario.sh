#!/usr/bin/env bash
# =============================================================================
# backup-diario.sh — Respaldo diario para cron: espera a que termine la ETL, ejecuta backup.sh con la
# configuración de /etc/sihul/backup.env y deja registro y estado.
#
# Cron (ver despliegue/servidor/cron-sihul-backup):  30 7 * * *  (07:30 UTC = 02:30 Colombia;
# la ETL corre de 05:00 a ~06:40 UTC).
#
# /etc/sihul/backup.env (permisos 600) puede definir, una por línea y sin comillas especiales:
#   DESTINO_RED=/mnt/sihul-respaldos          carpeta compartida YA montada (copia verificada)
#   BACKUP_PASSPHRASE_FILE=/etc/sihul/backup.pass   clave para cifrar con gpg
#   RETENCION_DIAS=14   RETENCION_RED_DIAS=30
# Estado de la última ejecución: /var/log/sihul-backup/ultimo.estado (OK o FALLO + fecha).
# =============================================================================
set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="${SIHUL_BACKUP_ENV:-/etc/sihul/backup.env}"
LOG_DIR="${LOG_DIR:-/var/log/sihul-backup}"
ESPERA_ETL_MIN="${ESPERA_ETL_MIN:-150}"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/backup-$(date +%Y-%m-%d).log"
exec >>"$LOG" 2>&1

echo "=== $(date '+%F %T %Z') inicio del respaldo diario"
if [[ -f "$CONFIG" ]]; then set -a; . "$CONFIG"; set +a; else echo "(sin $CONFIG: se usan los valores por defecto)"; fi

# No competir con la ETL por la base de datos.
for ((i = 0; i < ESPERA_ETL_MIN; i++)); do
  pgrep -f run_etl_completo >/dev/null || break
  (( i == 0 )) && echo "ETL en curso: espero hasta ${ESPERA_ETL_MIN} min"
  sleep 60
done

if bash "$RAIZ/scripts/backup.sh"; then
  echo "OK $(date '+%F %T %Z')" > "$LOG_DIR/ultimo.estado"
  echo "=== respaldo diario terminado"
else
  codigo=$?
  echo "FALLO($codigo) $(date '+%F %T %Z')" > "$LOG_DIR/ultimo.estado"
  echo "=== respaldo diario FALLÓ (código $codigo)"
  exit "$codigo"
fi
find "$LOG_DIR" -name 'backup-*.log' -mtime +60 -delete
