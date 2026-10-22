# Servidor SIHUL — cómo queda organizado

Estado tras el corte a producción del 22-oct-2026. Servidor Ubuntu en **UTC** (Colombia = UTC−5), 5,8 GB de RAM,
IP interna `10.4.100.146`. El HTTPS público lo termina un equipo de la universidad (certificado comodín
`*.unilibre.edu.co`, vence 25-feb-2027); el nginx del servidor no lo gestiona.

## 1. Dónde está cada cosa

| Qué | Ruta | Notas |
|---|---|---|
| Código, compose, scripts y nginx | `/opt/sihul-repo` | Clon de GitHub (rama `develop` o `main`). No editar a mano: `git pull` |
| Variables de producción y pruebas | `/opt/sihul-repo/despliegue/env/prod.env`, `test.env` | Permisos 600, fuera de git. **Se respaldan en cada backup** |
| `.env` para la ETL | `/opt/sihul-repo/despliegue/compose/.env` → `../env/prod.env` | Enlace; permite `docker compose exec` desde esa carpeta |
| Scripts de la ETL | `/opt/sihul/run_etl_completo.sh` (y `..._sin_estudiante.sh`) | Los lanza el cron de root; leen `/etc/sihul/etl.env` |
| Configuración de la ETL | `/etc/sihul/etl.env` | `PROJECT_DIR=/opt/sihul-repo/despliegue/compose`, `DOCKER_SERVICE=backend`, credenciales de Oracle |
| Configuración del respaldo | `/etc/sihul/backup.env` | Carpeta compartida, cifrado y retención (ver §3) |
| nginx de SIHUL | `/etc/nginx/sites-available/sihul` + `/etc/nginx/snippets/sihul-proxy.conf` | Origen: `despliegue/nginx/` |
| nginx de pruebas | `/etc/nginx/conf.d/sihul-pruebas.conf` | Puerto 5273 (solo red interna) |
| Respaldos locales | `/var/backups/sihul/<AAAAMMDD-HHMMSS>/` | `db.dump`, `media.tar.gz`, `config.tar.gz`, `SHA256SUMS`, `db.lista.txt` (14 días) |
| Registros de la ETL | `/var/log/sihul-etl/etl_<fecha>.log` | Uno por ejecución |
| Registros del respaldo | `/var/log/sihul-backup/` | `backup-<fecha>.log`, `ultimo.estado`, `verificacion.estado` |
| Estado del despliegue | `/opt/sihul-repo/despliegue/.estado/` | Versión actual y anterior de cada entorno |
| Stack anterior (se conserva) | `/root/ULlibre/SIHUL` | **No levantar a la vez que el nuevo** (comparten volumen). Retirar cuando se decida |
| Copia del nginx previo al corte | `/root/sihul.nginx.bak` | Para volver atrás |

El nginx del servidor también atiende otros sitios (`api-salud-mental`, `scrapingweb`) que no son de SIHUL: no se tocan.

## 2. Servicios (proyecto Docker Compose `sihul`)

| Servicio | Contenedor | Acceso | Límite de RAM |
|---|---|---|---|
| frontend (nginx) | `sihul-frontend-1` | `127.0.0.1:8080` | 64 MB |
| backend (Django) | `sihul-backend-1` | `127.0.0.1:8000` | 1,8 GB |
| chatbot (FastAPI) | `sihul-chatbot-1` | `127.0.0.1:8001` | 512 MB |
| db (PostgreSQL + pgvector) | `sihul-db-1` | solo red interna | 768 MB |
| redis | `sihul-redis-1` | solo red interna | 160 MB |

Datos persistentes: volúmenes `sihul_postgres_data`, `sihul_media` y `sihul_redis_data` (declarados `external`: si no
existen, el despliegue se detiene en vez de crear una base vacía). Subredes fijas: `10.201.2.0/24` (producción) y
`10.202.10.0/24` (pruebas). Entorno de pruebas (proyecto `sihul-test`): se levanta solo cuando se usa y se detiene después.

## 3. Tareas programadas

| Cuándo (UTC) | Qué | Dónde está |
|---|---|---|
| 05:00 diario (≈ 100 min) | ETL de Oracle | crontab de root |
| 07:30 diario | Respaldo (espera a que termine la ETL) | `/etc/cron.d/sihul-backup` |
| Domingo 08:30 | Verifica que el último respaldo se restaura | `/etc/cron.d/sihul-backup` |

Instalación (una vez, como root, desde `/opt/sihul-repo`):

```bash
cp despliegue/servidor/cron-sihul-backup /etc/cron.d/sihul-backup && chmod 644 /etc/cron.d/sihul-backup
cp despliegue/servidor/logrotate-sihul /etc/logrotate.d/sihul
mkdir -p /var/log/sihul-backup
```

Configuración del respaldo (`/etc/sihul/backup.env`, permisos 600). Sin carpeta compartida la copia queda solo en esta VM:

```bash
DESTINO_RED=/mnt/sihul-respaldos        # carpeta compartida YA montada
BACKUP_PASSPHRASE_FILE=/etc/sihul/backup.pass   # cifrar con gpg (guardar la clave TAMBIÉN fuera del servidor)
RETENCION_DIAS=14
RETENCION_RED_DIAS=30
```

Comprobar que el respaldo diario funciona: `cat /var/log/sihul-backup/ultimo.estado` (debe decir `OK` con fecha de hoy).

## 4. Restaurar un respaldo (solo ante un desastre)

Las copias nunca se restauran sobre la base en uso sin parar el stack. Orden, con la última copia sana:

```bash
cd /opt/sihul-repo
docker compose --env-file despliegue/env/prod.env -f despliegue/compose/docker-compose.yml -p sihul stop backend chatbot frontend
docker exec sihul-db-1 sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
docker exec -i sihul-db-1 sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl' < /var/backups/sihul/<carpeta>/db.dump
docker compose --env-file despliegue/env/prod.env -f despliegue/compose/docker-compose.yml -p sihul start backend chatbot frontend
```

(Si la copia está cifrada, descifrarla antes con `gpg`.) No usar `--clean`: deja objetos a medias. Ensayar siempre
primero con `despliegue/scripts/verificar-backup.sh`, que lo hace en una base temporal aislada.

## 5. Despliegue de una versión nueva

```bash
cd /opt/sihul-repo && git pull
bash despliegue/scripts/backup.sh                       # obligatorio: deploy.sh prod lo exige de las últimas 24 h
bash despliegue/scripts/deploy.sh prod <sha-corto-de-main>
bash despliegue/scripts/rollback.sh prod                # si hace falta volver a la versión anterior
```

`deploy.sh` descarga las imágenes de GHCR, aplica migraciones y espera a que todo esté sano; si no lo está, vuelve solo
a la versión anterior. Las migraciones **no se deshacen** al volver atrás: por eso cada cambio de esquema debe ser compatible
con el código anterior. Evitar horas de la ETL (05:00 a 06:40 UTC).
