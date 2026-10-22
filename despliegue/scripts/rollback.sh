#!/usr/bin/env bash
# =============================================================================
# rollback.sh — Vuelve a la versión anterior desplegada de un entorno.
#
# Uso: despliegue/scripts/rollback.sh <prod|test>
#
# Qué hace: redespliega la versión anterior (despliegue/.estado/<entorno>.tag.anterior)
# con las imágenes que siguen en el servidor.
# QUÉ NO HACE: no deshace migraciones de la base de datos. Si la versión mala aplicó una
# migración que borra o cambia columnas, volver el código puede no bastar: restaura el backup
# (despliegue/scripts/backup.sh deja uno antes de cada despliegue a producción).
# =============================================================================
set -euo pipefail

ENTORNO="${1:-}"
[[ -n "$ENTORNO" ]] || { echo "Uso: $0 <prod|test>" >&2; exit 2; }

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANTERIOR="$(cat "$RAIZ/.estado/${ENTORNO}.tag.anterior" 2>/dev/null || true)"
ACTUAL="$(cat "$RAIZ/.estado/${ENTORNO}.tag" 2>/dev/null || true)"
[[ -n "$ANTERIOR" ]] || { echo "No hay versión anterior registrada para '$ENTORNO'." >&2; exit 1; }

echo "[rollback] $ENTORNO: $ACTUAL -> $ANTERIOR"
read -r -p "¿Confirmas el rollback? (escribe 'si'): " RESP
[[ "$RESP" == "si" ]] || { echo "Cancelado."; exit 1; }

FORZAR=1 bash "$RAIZ/scripts/deploy.sh" "$ENTORNO" "$ANTERIOR"
