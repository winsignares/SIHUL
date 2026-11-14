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

echo "== Público y protegido, sin sesión ($BASE)"
verificar "El proceso responde (/health/)" "200" "$(codigo "$BASE/health/")"
LISTO="$(curl -s -m 15 "$BASE/health/ready/" 2>/dev/null)"
verificar "Base de datos y caché listas (/health/ready/)" "ok" "$(echo "$LISTO" | grep -o '"status": *"[a-z]*"' | grep -o '[a-z]*"$' | tr -d '"')"
verificar "El frontend carga" "200" "$(codigo "$BASE/")"
verificar "La API de usuarios exige sesión" "401|403" "$(codigo "$BASE/api/usuarios/")"
verificar "La API de horarios exige sesión" "401|403" "$(codigo "$BASE/api/horarios/")"
verificar "La API de facturas exige sesión" "401|403" "$(codigo "$BASE/api/financiero/facturas/")"
verificar "Los eventos en tiempo real exigen sesión" "401" "$(codigo "$BASE/api/eventos/")"
verificar "El chat con sesión la exige" "401" "$(codigo -X POST -H 'Content-Type: application/json' -d '{}' "$BASE/api/chatbot/pregunta/")"
verificar "El servicio interno del chatbot no se publica" "404" "$(codigo "$BASE/chatbot/docs")"

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
  verificar "El tiempo real no se guarda en caché ni en buffer" "si" "$(echo "$CAB" | grep -qi '^x-accel-buffering: no' && echo si || echo no)"
else
  echo "== (Sin PRUEBA_CORREO y PRUEBA_CLAVE no se prueba lo privado)"
fi

echo
echo "RESUMEN: $OK correctas, $FALLAS con falla"
exit $(( FALLAS > 0 ? 1 : 0 ))
