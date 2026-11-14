#!/usr/bin/env bash
# =============================================================================
# probar-entorno.sh — Pruebas de humo de un entorno ya desplegado, solo con curl.
#
# Uso:
#   despliegue/scripts/probar-entorno.sh <URL_BASE>
#   PRUEBA_CORREO=prueba.sistema@unilibre.edu.co PRUEBA_CLAVE='<clave>' despliegue/scripts/probar-entorno.sh <URL_BASE>
#
# Ejemplos de URL_BASE: https://sihul.unilibre.edu.co  |  http://<ip>:5273
#
# Variables opcionales:
#   BACKEND_DIRECTO  URL directa del backend para la salud (por ejemplo http://127.0.0.1:8100 en el servidor de pruebas).
#                    Útil cuando nginx no enruta /health/ al backend (en pruebas lo atiende el frontend).
#   ENTORNO=pruebas  en pruebas nginx sí publica /chatbot/docs; se acepta 200 o 404.
#
# Sin credenciales comprueba lo público y que lo privado pida sesión.
# Con PRUEBA_CORREO y PRUEBA_CLAVE (el usuario de crear_usuario_pruebas) también inicia sesión y prueba lo privado.
# No crea ni borra datos. La clave se lee del entorno y nunca se imprime.
# =============================================================================
set -uo pipefail

BASE="${1:-}"
[[ -n "$BASE" ]] || { echo "Uso: $0 <URL_BASE>" >&2; exit 2; }
BASE="${BASE%/}"
OK=0; FALLAS=0
JAR="$(mktemp)"; trap 'rm -f "$JAR"' EXIT

codigo() { local c; c="$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$@" 2>/dev/null)"; echo "${c:-000}"; }
verificar() {  # verificar "descripcion" "esperados (separados por |)" "obtenido"
  if [[ "|$2|" == *"|$3|"* ]]; then echo "  OK     $1"; OK=$((OK+1)); else echo "  FALLA  $1  (esperado $2, obtenido $3)"; FALLAS=$((FALLAS+1)); fi
}

SALUD="${BACKEND_DIRECTO:-$BASE}"; SALUD="${SALUD%/}"
echo "== Público y protegido, sin sesión ($BASE)"
VIVO="$(curl -s -m 15 "$SALUD/health/" 2>/dev/null)"
verificar "El backend responde (/health/ devuelve JSON con estado)" "si" "$(echo "$VIVO" | grep -q '"status"' && echo si || echo no)"
LISTO="$(curl -s -m 15 "$SALUD/health/ready/" 2>/dev/null)"
verificar "Base de datos y caché listas (/health/ready/)" "ok" "$(echo "$LISTO" | grep -o '"status": *"[a-z]*"' | head -1 | grep -o '[a-z]*"$' | tr -d '"')"
verificar "El frontend carga" "200" "$(codigo "$BASE/")"
verificar "La API de usuarios exige sesión" "401|403" "$(codigo "$BASE/api/usuarios/")"
verificar "La API de horarios exige sesión" "401|403" "$(codigo "$BASE/api/horarios/")"
verificar "La API de facturas exige sesión" "401|403" "$(codigo "$BASE/api/financiero/facturas/")"
verificar "Los eventos en tiempo real exigen sesión" "401" "$(codigo "$BASE/api/eventos/")"
verificar "El chat con sesión la exige" "401" "$(codigo -X POST -H 'Content-Type: application/json' -d '{}' "$BASE/api/chatbot/pregunta/")"
if [[ "${ENTORNO:-}" == "pruebas" ]]; then ESPERADO_CHATBOT="200|404"; else ESPERADO_CHATBOT="404"; fi
verificar "El servicio interno del chatbot no se publica (en pruebas se acepta que sí)" "$ESPERADO_CHATBOT" "$(codigo "$BASE/chatbot/docs")"

if [[ -n "${PRUEBA_CORREO:-}" && -n "${PRUEBA_CLAVE:-}" ]]; then
  echo "== Con el usuario de pruebas"
  CUERPO="$(printf '{"correo":"%s","contrasena":"%s"}' "$PRUEBA_CORREO" "$PRUEBA_CLAVE")"
  verificar "Inicia sesión" "200" "$(codigo -c "$JAR" -X POST -H 'Content-Type: application/json' -d "$CUERPO" "$BASE/api/usuarios/login/")"
  verificar "La sesión queda activa" "200" "$(codigo -b "$JAR" "$BASE/api/usuarios/session-auth-state/")"
  for ruta in sedes facultades programas espacios periodos horarios prestamos/espacios notificaciones chatbot/agentes componentes usuarios roles; do
    verificar "Lista /api/$ruta/" "200" "$(codigo -b "$JAR" "$BASE/api/$ruta/")"
  done
  for ruta in facturas proveedores parametros-sla departamentos; do
    verificar "Lista /api/financiero/$ruta/" "200" "$(codigo -b "$JAR" "$BASE/api/financiero/$ruta/")"
  done
  CAB="$(curl -s -m 5 -D - -o /dev/null -b "$JAR" "$BASE/api/eventos/" 2>/dev/null | tr -d '\r')"
  verificar "El tiempo real responde 200" "200" "$(echo "$CAB" | head -1 | awk '{print $2}')"
  verificar "El tiempo real es text/event-stream" "si" "$(echo "$CAB" | grep -qi '^content-type: text/event-stream' && echo si || echo no)"
  # Sin buffer en nginx, la primera línea del flujo llega enseguida (con buffer no llegaría hasta juntar varios KB).
  PRIMERA="$(curl -s -N -m 4 -b "$JAR" "$BASE/api/eventos/" 2>/dev/null | head -c 40 | tr -d '\r\n')"
  verificar "El tiempo real llega sin demora (nginx no lo retiene)" "si" "$(echo "$PRIMERA" | grep -q 'retry:' && echo si || echo no)"
else
  echo "== (Sin PRUEBA_CORREO y PRUEBA_CLAVE no se prueba lo privado)"
fi

echo
echo "RESUMEN: $OK correctas, $FALLAS con falla"
exit $(( FALLAS > 0 ? 1 : 0 ))
