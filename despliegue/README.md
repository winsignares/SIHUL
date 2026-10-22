# Despliegue de SIHUL

Todo lo necesario para desplegar y operar SIHUL en el servidor vive aquí, dentro del mismo
repositorio que el código (un cambio de código y su cambio de despliegue van en el mismo PR).

```
despliegue/
├─ docker/     Dockerfiles de PRODUCCIÓN (backend, chatbot, frontend) + nginx del contenedor frontend
├─ compose/    docker-compose.yml único, para producción y pruebas
├─ env/        plantillas (*.env.example). Los .env reales NO se versionan
├─ nginx/      configuración del nginx del servidor (producción y pruebas)
├─ scripts/    deploy · rollback · backup · inventario
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

## Migración del servidor actual, por fases con punto de retorno

Regla: **no se toca lo que corre hasta tener inventario, backup verificado y ensayo.**

| Fase | Qué se hace | Retorno |
|---|---|---|
| 0 | `inventario.sh` y `backup.sh`; copiar el backup a la carpeta compartida; restauración de prueba | Nada que revertir |
| 1 | Certificado: `certbot certonly --dry-run`; si funciona, renovar y recargar nginx | Restaurar la copia de nginx |
| 2 | **Ensayo** en paralelo: proyecto `sihul-ensayo`, puertos 18080/18000/18001 y una **copia** de la base restaurada | `docker compose down -v` del proyecto de ensayo |
| 3 | **Pruebas nuevo**: apagar el stack de pruebas viejo, `deploy.sh test`, activar `sihul-pruebas.conf` | Levantar el stack viejo |
| 4 | **Producción** (ventana corta): backup final → `down` del stack viejo (sin `-v`) → `deploy.sh prod` → instalar `sihul.conf` → `nginx -t` → `reload` → verificar | `rollback.sh prod`, o levantar el stack viejo y restaurar la copia de nginx |
| 5 | Actualizar `PROJECT_DIR` del ETL, probarlo; cerrar puertos viejos; firewall; limpiar imágenes; actualizar el sistema y reiniciar | — |

### Lo que depende del despliegue actual y NO se debe romper

- **El ETL de las 5:00** (`/opt/sihul/run_etl_completo.sh`) ejecuta `docker compose exec -T backend python manage.py …`
  dentro de `PROJECT_DIR` (`/etc/sihul/etl.env`). Después del corte hay que apuntar `PROJECT_DIR` a la carpeta con el compose nuevo,
  que debe dejar `COMPOSE_FILE` y `COMPOSE_PROJECT_NAME` en un `.env` de esa carpeta, y probarlo a mano.
- El proyecto Compose se sigue llamando **`sihul`** y el servicio **`backend`**.
- La contraseña de la base de datos de producción es la **actual** (la base ya está inicializada con ella); se cambia
  después, en un paso aparte.
- El certificado, su ruta y la carpeta `/var/www/sihul` (validación ACME) se mantienen.

## Lo que este despliegue NO resuelve todavía

- El chatbot no autentica y sigue expuesto en `/chatbot/` (hallazgo de seguridad pendiente).
- La contraseña por defecto de la base de datos.
- Observabilidad y alertas por correo (esperan la ampliación de RAM).
- Despliegue automático por runner (cuando las reglas de ramas estén activas).
