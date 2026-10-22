# Despliegue de SIHUL

Todo lo necesario para desplegar y operar SIHUL en el servidor vive aquí, dentro del mismo
repositorio que el código (un cambio de código y su cambio de despliegue van en el mismo PR).

```
despliegue/
├─ docker/     Dockerfiles de PRODUCCIÓN (backend, chatbot, frontend) + nginx del contenedor frontend
├─ compose/    docker-compose.yml único, para producción y pruebas
├─ env/        plantillas (*.env.example). Los .env reales NO se versionan
├─ nginx/      configuración del nginx del servidor (producción y pruebas)
├─ scripts/    deploy · rollback · backup · inventario · verificar-nas
└─ github/     reglas de protección de ramas (las aplica un administrador)
```

## Cómo queda todo

```
Red de la universidad
        │
        ▼
  nginx del servidor ── 80/443 (misma IP, mismo dominio, mismo certificado)
        │    └─ 5273: entorno de pruebas (mismo URL de hoy, http)
        │
        ├─ PRODUCCIÓN (proyecto "sihul")
        │    /                              → frontend (contenedor, 127.0.0.1:8080)
        │    /api /panel /accounts /media   → backend  (127.0.0.1:8000)
        │    /chatbot                       → chatbot  (127.0.0.1:8001)
        │        backend + chatbot → redis → postgres (MISMO volumen de hoy)
        │
        └─ PRUEBAS (proyecto "sihul-test"): mismos servicios, otras imágenes, otra base,
             puertos 127.0.0.1:8180/8100/8101
```

| Principio | Cómo se cumple |
|---|---|
| Imágenes inmutables | Una imagen por versión (`TAG`); sin código montado |
| Una sola entrada | Solo nginx escucha hacia la red; los contenedores publican en `127.0.0.1` |
| Mínimo privilegio | Contenedores sin root; cada servicio recibe solo sus secretos |
| Nada lento al arrancar | `migrate` y `collectstatic` van en el job `release` |
| Un servicio no tumba a otro | Límites de memoria/CPU por contenedor; logs con rotación; reciclado de procesos |
| Reversible | `deploy.sh` vuelve solo a la versión anterior si algo no queda sano |
| **No se toca la base** | Volúmenes `external: true` en producción: si no existen, Docker falla y no crea uno vacío |

## Red de Docker: subredes FIJAS (obligatorio)

Cada entorno declara su subred en el `.env` (`DOCKER_NETWORK_SUBNET` y `DOCKER_NETWORK_GATEWAY`) y el compose **se niega a arrancar** si faltan.
Si Docker eligiera una por su cuenta podría tomar `172.18.0.0/16`, `172.20.0.0/16`… que son rangos de la red de la universidad
(en los logs del servidor aparecen clientes en `172.18.x`, `172.20.x`, `172.16.x` y `172.43.x`): el servidor dejaría de poder
responderles y se perdería el acceso, **incluido el SSH por el puerto 22**.

| Entorno | Subred | Gateway | Nota |
|---|---|---|---|
| Producción | `10.201.2.0/24` | `10.201.2.1` | La misma que usa hoy `sihul_network` |
| Pruebas | `10.202.10.0/24` | `10.202.10.1` | La misma que usa hoy el stack de pruebas |
| Ensayo en paralelo | `10.201.3.0/24` | `10.201.3.1` | Solo mientras convive con el stack actual |

La red vieja y la nueva usan la misma subred, así que **no pueden existir a la vez**: el stack viejo se apaga con `docker compose down`
(que elimina su red, sin tocar los volúmenes) antes de levantar el nuevo.

Protección adicional recomendada (una sola vez, dentro de la ventana de mantenimiento, porque exige reiniciar Docker):

```json
/etc/docker/daemon.json
{ "default-address-pools": [ { "base": "10.200.0.0/16", "size": 24 } ], "bip": "10.200.255.1/24" }
```

Así, cualquier red que se cree sin subred explícita (por ejemplo un `docker run` suelto) tomará un rango de `10.200.x.x` y nunca uno de `172.x`.

## Equivalencia con el despliegue actual

Lo que se copió de lo que corre hoy, y lo que cambia (para saber qué verificar):

| Tema | Hoy (servidor) | Nuevo | ¿Riesgo? |
|---|---|---|---|
| Volumen de la base de datos | `sihul_postgres_data` | **El mismo** (`external: true`) | No: si no existe, falla |
| Volumen de archivos | `sihul_media` | **El mismo** (`external: true`) | No |
| Imagen y versión de Postgres | `pgvector/pgvector:pg16` (local) | **La misma**; `deploy.sh` no la descarga | No |
| Base, usuario y contraseña | `mypostgresdb` / `postgres` / la actual | **Los mismos** (se copian al `.env`) | Si no se copian, el backend no conecta (se nota al instante) |
| Carpeta compartida de financiero | `FINANCIERO_DOCUMENT_NETWORK_ROOT/USER/PASSWORD` | **Mismos nombres y valores**; SMB directo desde el contenedor | **Se desactiva en silencio si faltan** → usar `verificar-nas.sh` |
| Subredes | `10.201.2.0/24`, `10.202.10.0/24` | **Las mismas** (obligatorias) | No |
| CORS / CSRF | No definidos: valores por defecto del código | **Vacíos** (mismos valores por defecto) | No |
| Nombre del proyecto y del servicio del ETL | `sihul` / `backend` | **Los mismos** | No, pero hay que actualizar `PROJECT_DIR` |
| Nombres de contenedor | `sihul-backend`, `postgres_db`, `sihul-redis`… | `sihul-backend-1`, `sihul-db-1`… (los asigna Compose) | Medio: cualquier comando manual con `docker exec <nombre>` debe actualizarse. Los scripts usan etiquetas, no nombres |
| Código | Carpeta del servidor montada en el contenedor | Dentro de la imagen | Medio: archivos que un comando manual escribía en `/app` (por ejemplo el CSV de `horarios_por_espacio`) ya no quedan en el servidor; usar `docker cp` |
| Frontend | Build copiado a `/var/www/sihul` | Contenedor | No |
| Contenedores | root, sin límites | Sin root, con límites | Bajo: los volúmenes de archivos se ajustan solos en `deploy.sh` |

Ya se comprobó en el código que el módulo financiero usa **SMB directo desde el contenedor hacia el NAS** (no un montaje del servidor) y
solo depende de esas tres variables y de que el contenedor llegue por red al servidor de archivos, igual que hoy.

## Memoria: perfil para la VM actual (5,8 GB)

| | Producción | Pruebas |
|---|---|---|
| Base de datos | 768 MB | 384 MB |
| Backend | 1,75 GB | 768 MB |
| Chatbot | 512 MB | 384 MB |
| Redis | 160 MB | 96 MB |
| Frontend | 64 MB | 48 MB |
| **Total** | **≈ 3,3 GB** | **≈ 1,7 GB** |

Con 5,8 GB, **producción siempre arriba y pruebas solo cuando se usa** (`docker compose ... stop` al terminar).
La observabilidad espera a la ampliación de RAM. Con 16 GB ver el bloque comentado de `prod.env.example`.

## Uso (en el servidor)

```bash
cp despliegue/env/prod.env.example despliegue/env/prod.env && chmod 600 despliegue/env/prod.env   # una vez
sudo bash despliegue/scripts/backup.sh                       # backup (deploy.sh lo exige en producción)
despliegue/scripts/deploy.sh prod <sha-corto>                # descarga la imagen y despliega
despliegue/scripts/rollback.sh prod                          # vuelve a la versión anterior
```

Las imágenes las construye GitHub (`.github/workflows/build-images.yml`) y las publica en GHCR al
fusionar a `develop` o `main`. El servidor las descarga: debe iniciar sesión una vez con una clave de
solo lectura (`docker login ghcr.io`).

> **Estado:** el corte a producción se hizo el 22-oct-2026 (fases 0 a 4 completadas). La organización del servidor,
> los respaldos y la restauración están en [`SERVIDOR.md`](SERVIDOR.md); el procedimiento del corte, en
> [`CORTE-PRODUCCION.md`](CORTE-PRODUCCION.md). Lo que sigue es histórico.

## Migración del servidor actual, por fases con punto de retorno

Regla: **no se toca lo que corre hasta tener inventario, backup verificado y ensayo.**

| Fase | Qué se hace | Retorno |
|---|---|---|
| 0 | `inventario.sh` y `backup.sh`; copiar el backup a la carpeta compartida; restauración de prueba | Nada que revertir |
| 1 | Certificado: **no aplica**. El HTTPS lo termina un equipo de la universidad con un certificado comodín (RapidSSL, vence 25-feb-2027); el del servidor (Let's Encrypt) está vencido y no lo ve ningún usuario. No se toca. | — |
| 2 | **Ensayo** en paralelo: proyecto `sihul-ensayo`, puertos 18080/18000/18001 y una **copia** de la base restaurada | `docker compose down -v` del proyecto de ensayo |
| 3 | **Pruebas nuevo**: `docker compose -f docker-compose.test.yml down` del stack viejo (sin `-v`), `deploy.sh test`, activar `sihul-pruebas.conf` | Levantar el stack viejo |
| 4 | **Producción** (ventana corta): backup final → `down` del stack viejo (sin `-v`; así se libera la subred y **nunca hay dos Postgres sobre el mismo volumen**) → `deploy.sh prod` → `verificar-nas.sh prod` → instalar `sihul.conf` → `nginx -t` → `reload` → verificar el sitio | `rollback.sh prod`, o `down` del nuevo + `up -d` del stack viejo (mismo volumen) y restaurar la copia de nginx |
| 5 | Actualizar `PROJECT_DIR` del ETL y probarlo a mano; `daemon.json` con `default-address-pools`; cerrar puertos viejos; firewall; limpiar imágenes; actualizar el sistema y reiniciar | — |

### Lo que depende del despliegue actual y NO se debe romper

- **El ETL de las 5:00** (`/opt/sihul/run_etl_completo.sh`) ejecuta `docker compose exec -T backend python manage.py …`
  dentro de `PROJECT_DIR` (`/etc/sihul/etl.env`). Después del corte hay que apuntar `PROJECT_DIR` a la carpeta con el compose nuevo,
  que debe dejar `COMPOSE_FILE` y `COMPOSE_PROJECT_NAME` en un `.env` de esa carpeta, y probarlo a mano.
- El proyecto Compose se sigue llamando **`sihul`** y el servicio **`backend`**.
- **Volver atrás con la base de datos:** el volumen es el mismo en ambos stacks, así que se vuelve apagando el nuevo y levantando el viejo.
  Las migraciones nuevas (permisos de chatbots) **solo agregan** una tabla y un componente, y el código viejo las ignora; aun así
  el backup previo es obligatorio. Nunca deben correr los dos stacks a la vez sobre el mismo volumen.
- La contraseña de la base de datos de producción es la **actual** (la base ya está inicializada con ella); se cambia
  después, en un paso aparte.
- El certificado, su ruta y la carpeta `/var/www/sihul` (validación ACME) se mantienen.

## Lo que este despliegue NO resuelve todavía

- El chatbot no autentica y sigue expuesto en `/chatbot/` (hallazgo de seguridad pendiente).
- La contraseña por defecto de la base de datos.
- Observabilidad y alertas por correo (esperan la ampliación de RAM).
- Despliegue automático por runner (cuando las reglas de ramas estén activas).
