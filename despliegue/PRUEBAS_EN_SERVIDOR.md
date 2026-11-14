# Pruebas en el entorno de pruebas del servidor

Cómo dejar listo el entorno de pruebas, probar cada cosa con comandos y limpiar al terminar. **Primero siempre en el entorno de pruebas (`test`); producción solo después.**

Convención: los comandos usan el atajo `DC` (el mismo archivo y variables que usa `deploy.sh`):

```bash
cd /ruta/del/repositorio
DC="docker compose --env-file despliegue/env/test.env -f despliegue/compose/docker-compose.yml"
```

## 1. Desplegar en pruebas
```bash
bash despliegue/scripts/deploy.sh test <tag>
$DC ps        # backend, eventos, chatbot y frontend deben estar healthy
```
Sigue `despliegue/TIEMPO_REAL_Y_COLA.md` para el bloque de nginx del servicio de eventos (puerto 8102 en pruebas).

## 2. Crear el usuario de pruebas (todos los módulos)
```bash
$DC exec backend python manage.py crear_usuario_pruebas
```
Muestra el correo (`prueba.sistema@unilibre.edu.co`) y una clave al azar, **una sola vez**. Tiene rol administrador, permiso de edición en todos los componentes y alcance de administrador general. Para otra seccional: `--seccional Cali`. Si se pierde la clave, volver a ejecutar el comando la restablece.

## 3. Pruebas de humo (sin entrar a ninguna pantalla)
```bash
ENTORNO=pruebas BACKEND_DIRECTO=http://127.0.0.1:8100 \
PRUEBA_CORREO=prueba.sistema@unilibre.edu.co PRUEBA_CLAVE='<clave>' \
  bash despliegue/scripts/probar-entorno.sh http://<ip>:5273
```
- `BACKEND_DIRECTO`: en pruebas nginx envía `/health/` al frontend, así que la salud se consulta directo al backend (`http://127.0.0.1:8100`; en producción no hace falta).
- `ENTORNO=pruebas`: en pruebas nginx publica `/chatbot/docs` a propósito; en producción debe dar 404.
Comprueba, con curl: salud, frontend, que lo privado pida sesión, inicio de sesión, los listados de cada módulo, y que el tiempo real responda como `text/event-stream`. Debe terminar en `0 con falla`. No crea ni borra datos.

## 4. Probar cada cosa por comandos
Iniciar sesión una vez y reutilizar la cookie:
```bash
BASE=http://<ip>:5273
curl -s -c /tmp/c.txt -X POST $BASE/api/usuarios/login/ -H 'Content-Type: application/json' \
  -d '{"correo":"prueba.sistema@unilibre.edu.co","contrasena":"<clave>"}' | head -c 120
```
Todo lo que crees debe empezar por **PRUEBA-** con el guion (así lo encuentra la limpieza). Con el guion a propósito: en producción hay datos reales que empiezan por «PRUEBA» (asignaturas como «PRUEBAS PENALES»).

**Tiempo real.** En una terminal, dejar abierta la conexión de eventos:
```bash
curl -N -b /tmp/c.txt $BASE/api/eventos/
```
En otra terminal, crear una sede. En la primera debe aparecer `data: {"recurso": "sedes", ...}` al instante:
```bash
SECC=$(curl -s -b /tmp/c.txt $BASE/api/sedes/ | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['seccional'])")
curl -s -b /tmp/c.txt -X POST $BASE/api/sedes/ -H 'Content-Type: application/json' \
  -d "{\"nombre\":\"PRUEBA-sede\",\"seccional_id\":$SECC,\"activa\":true}"
```
(Si el POST pide un token CSRF, enviar también `-H "X-CSRFToken: $(grep csrftoken /tmp/c.txt | awk '{print $7}')"`.)

**Espacio y préstamo.**
```bash
curl -s -b /tmp/c.txt $BASE/api/espacios/ | head -c 300        # elegir un id de espacio y de tipo de actividad
curl -s -b /tmp/c.txt -X POST $BASE/api/prestamos/espacios/ -H 'Content-Type: application/json' \
  -d '{"fecha":"<AAAA-MM-DD futura>","hora_inicio":"20:00:00","hora_fin":"21:00:00","motivo":"PRUEBA-préstamo","asistentes":5,"telefono":"3000000000","espacio":<id>,"tipo_actividad":<id>}'
```
Repetir el mismo POST: debe rechazarse por traslape.

**Permisos por paso de la factura.** Con el usuario de pruebas (administración) los pasos se aceptan; con una persona de cada rol real se comprueba que cada uno solo hace el suyo (el rol equivocado recibe 403). Es la prueba más importante antes de producción: pedir a una persona de cada rol financiero (funcionario, contabilidad, tesorería, auditoría, dirección, rectoría y un proveedor) que ejecute su paso sobre una factura `PRUEBA-`.

**Chat.**
```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST $BASE/api/chatbot/pregunta/ -H 'Content-Type: application/json' -d '{}'   # 401 sin sesión
```

## 5. Dos personas a la vez (la prueba que prueba el tiempo real)
Abrir dos navegadores (o uno normal y uno privado), iniciar sesión con dos personas de la misma seccional, dejar una con la lista de sedes (o de préstamos) abierta y crear un dato con la otra. La lista de la primera debe actualizarse sola.

## 6. Limpiar al terminar
```bash
$DC exec backend python manage.py limpiar_pruebas                 # solo cuenta lo que se borraría
$DC exec backend python manage.py limpiar_pruebas --confirmar     # lo borra
$DC exec backend python manage.py crear_usuario_pruebas --eliminar
```
`limpiar_pruebas` borra lo que empieza por `PRUEBA-` (sedes, espacios, préstamos, horarios en espacios de prueba, solicitudes, facturas, proveedores, asignaturas, grupos, programas, facultades, periodos, recursos y el usuario de pruebas con sus avisos). Con `--prefijo OTRO` se limpia otro lote. Si algo tiene dependencias, lo informa y sigue con lo demás.

## Reglas
- El usuario de pruebas es de administración total: **crearlo y borrarlo solo en pruebas**, y eliminarlo al terminar. No se crea en producción.
- La clave solo se muestra al crearlo; no se guarda en el repositorio ni en ningún archivo.
- Lo que se crea en pruebas no pasa a producción: son bases distintas.
