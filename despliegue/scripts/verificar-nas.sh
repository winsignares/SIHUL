#!/usr/bin/env bash
# =============================================================================
# verificar-nas.sh — Comprueba, SOLO LEYENDO, que el backend puede usar la carpeta compartida
# del módulo financiero (NAS). Úsalo después de cada despliegue.
#
# Uso: despliegue/scripts/verificar-nas.sh <prod|test>
#
# Por qué existe: si las variables FINANCIERO_DOCUMENT_NETWORK_* no llegan al contenedor, el
# servicio de financiero NO falla: se desactiva en silencio ("NAS no configurado") y deja de
# copiar documentos a la carpeta compartida. Este script lo detecta.
# No escribe, no crea y no borra nada en la carpeta compartida (solo lista).
# =============================================================================
set -euo pipefail

ENTORNO="${1:-}"
[[ "$ENTORNO" == "prod" || "$ENTORNO" == "test" ]] || { echo "Uso: $0 <prod|test>" >&2; exit 2; }

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if command -v cygpath >/dev/null 2>&1; then RAIZ="$(cygpath -m "$RAIZ")"; fi
ENV_FILE="$RAIZ/env/${ENTORNO}.env"
COMPOSE_FILE="$RAIZ/compose/docker-compose.yml"
[[ -f "$ENV_FILE" ]] || { echo "Falta $ENV_FILE" >&2; exit 1; }

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T backend python manage.py shell <<'PY'
from financiero.services.shared_storage_service import SharedStorageService, _parse_unc, _smb_path

servicio = SharedStorageService()
print('FINANCIERO_DOCUMENT_NETWORK_* configuradas:', servicio.enabled)
if not servicio.enabled:
    raise SystemExit('ERROR: faltan variables FINANCIERO_DOCUMENT_NETWORK_ROOT/USER/PASSWORD en el contenedor')

servidor, recurso, base = _parse_unc(servicio.unc_root)
smbclient, _ = servicio._get_smb_client()
entradas = smbclient.listdir(_smb_path(servidor, recurso, base))
print(f'OK: el servidor {servidor} responde y la carpeta compartida es accesible ({len(entradas)} entradas)')
PY
