#!/usr/bin/env bash
# =============================================================================
# migrar-env.sh — Arma despliegue/env/prod.env a partir de los .env que ya usa producción,
# SIN mostrar ningún valor (solo nombres de variables).
#
# Lee (solo lectura):  <DIR>/.env  <DIR>/chatbot/.env  <DIR>/.env.db
# Escribe:             despliegue/env/prod.env  (permisos 600; no sobrescribe si ya existe)
#
# Solo copia variables de DATOS (claves, credenciales, dominio, cookies, periodo de la ETL...).
# Lo que depende del despliegue (puertos, límites de memoria, subredes, etiqueta de imagen) se
# queda como en prod.env.example. Al terminar lista, por nombre:
#   - copiadas, - obligatorias que siguen vacías, - variables viejas que NO se migraron (revisar).
#
# Uso (como root):   bash despliegue/scripts/migrar-env.sh [DIR_ACTUAL]
#   DIR_ACTUAL por defecto: /root/ULlibre/SIHUL
# =============================================================================
set -euo pipefail

DIR="${1:-/root/ULlibre/SIHUL}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLANTILLA="$RAIZ/env/prod.env.example"
DESTINO="$RAIZ/env/prod.env"
FUENTES=("$DIR/.env" "$DIR/chatbot/.env" "$DIR/.env.db")

# Variables de datos que se trasladan tal cual (el resto se queda con el valor de la plantilla).
COPIABLES=" DB_NAME DB_USER DB_PASSWORD DJANGO_SECRET_KEY DJANGO_ALLOWED_HOSTS FRONTEND_URL
 SESSION_COOKIE_NAME CSRF_COOKIE_NAME MICROSOFT_CLIENT_ID MICROSOFT_CLIENT_SECRET MICROSOFT_TENANT
 RECAPTCHA_SITE_KEY RECAPTCHA_SECRET_KEY FINANCIERO_DOCUMENT_NETWORK_ROOT FINANCIERO_DOCUMENT_NETWORK_USER
 FINANCIERO_DOCUMENT_NETWORK_PASSWORD OPENAI_API_KEY CHUNK_SIZE CHUNK_OVERLAP EMBEDDING_MODEL CHAT_MODEL
 ETL_PERIODO CHATBOT_ANEXO_MAX_MB CHATBOT_ANEXO_MAX_POR_RESPUESTA CHATBOT_ANEXO_URL_MAX_AGE "
COPIABLES="$(echo "$COPIABLES" | tr '
' ' ')"
es_copiable() { [[ "$COPIABLES" == *" $1 "* ]]; }

[[ -f "$PLANTILLA" ]] || { echo "ERROR: no encuentro $PLANTILLA" >&2; exit 1; }
if [[ -e "$DESTINO" ]]; then
  echo "ERROR: $DESTINO ya existe. No lo sobrescribo; muévelo o bórralo si quieres regenerarlo." >&2
  exit 1
fi

declare -A VIEJO
for f in "${FUENTES[@]}"; do
  if [[ -f "$f" ]]; then
    echo "[env] leyendo $f"
    while IFS= read -r linea || [[ -n "$linea" ]]; do
      [[ "$linea" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
      clave="${BASH_REMATCH[1]}"
      valor="${BASH_REMATCH[2]}"
      valor="${valor%$'\r'}"
      # La primera fuente que define la variable manda (.env antes que chatbot/.env y .env.db).
      [[ -n "${VIEJO[$clave]+x}" ]] || VIEJO[$clave]="$valor"
    done < "$f"
  else
    echo "[env] (no existe $f, se omite)"
  fi
done

# Compose interpreta "$" en los .env; en un env_file no. Se protege con comillas simples.
proteger() {
  local v="$1"
  if [[ "$v" == *'$'* && "$v" != \'* && "$v" != \"* ]]; then
    if [[ "$v" == *"'"* ]]; then echo "[env] AVISO: el valor contiene \$ y ' a la vez; revisa a mano" >&2; fi
    printf "'%s'" "$v"
  else
    printf '%s' "$v"
  fi
}

umask 077
declare -A USADA
copiadas=(); vacias=()
: > "$DESTINO"
while IFS= read -r linea || [[ -n "$linea" ]]; do
  linea="${linea%$'\r'}"
  if [[ "$linea" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    clave="${BASH_REMATCH[1]}"
    resto="${BASH_REMATCH[2]}"
    if [[ "$COPIABLES" == *" $clave "* || "$COPIABLES" == *" $clave"$'\n'* ]] && [[ -n "${VIEJO[$clave]+x}" ]]; then
      comentario=""
      printf '%s=%s\n' "$clave" "$(proteger "${VIEJO[$clave]}")" >> "$DESTINO"
      USADA[$clave]=1; copiadas+=("$clave")
      continue
    fi
    sin_comentario="${resto%%#*}"
    [[ -z "${sin_comentario// /}" ]] && vacias+=("$clave")
  fi
  printf '%s\n' "$linea" >> "$DESTINO"
done < "$PLANTILLA"

# Variables de datos del servidor actual que la plantilla no trae (p. ej. ETL_PERIODO): se añaden.
extras=()
for clave in "${!VIEJO[@]}"; do
  [[ -n "${USADA[$clave]+x}" ]] && continue
  if [[ "$COPIABLES" == *" $clave "* || "$COPIABLES" == *" $clave"$'\n'* ]]; then
    printf '%s=%s\n' "$clave" "$(proteger "${VIEJO[$clave]}")" >> "$DESTINO"
    USADA[$clave]=1; extras+=("$clave")
  fi
done
chmod 600 "$DESTINO"

echo
echo "[env] Archivo creado: $DESTINO (permisos 600)"
echo "[env] COPIADAS (${#copiadas[@]}):  ${copiadas[*]:-ninguna}"
echo "[env] AÑADIDAS que la plantilla no traía:  ${extras[*]:-ninguna}"
echo "[env] OBLIGATORIAS/VACÍAS que debes revisar o completar:  ${vacias[*]:-ninguna}"
sinmigrar=()
for clave in "${!VIEJO[@]}"; do [[ -n "${USADA[$clave]+x}" ]] || sinmigrar+=("$clave"); done
IFS=$'\n' sinmigrar=($(sort <<<"${sinmigrar[*]:-}")); unset IFS
echo "[env] Variables del servidor actual que NO se migraron (revisa que ninguna haga falta):"
echo "      ${sinmigrar[*]:-ninguna}"
