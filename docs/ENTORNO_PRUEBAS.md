# Entorno de pruebas SIHUL

Este entorno usa el proyecto Compose `sihul-test` y no reutiliza los
contenedores, la red ni los volúmenes del stack principal `sihul`.

## Archivos

- `docker-compose.test.yml`: servicios aislados de prueba.
- `.env.test.example`: plantilla versionada.
- `.env.test`: configuración local ignorada por Git.

## URLs y puertos

- Frontend: `http://localhost:5273`
- Backend: `http://localhost:8100`
- Chatbot: `http://localhost:8101`
- PostgreSQL: `localhost:55432`
- Red Docker: `10.202.10.0/24` (`10.202.10.1` como gateway)

Los puertos internos siguen siendo `5173`, `8000`, `8001` y `5432`.
La subred puede cambiarse con `TEST_DOCKER_NETWORK_SUBNET` y
`TEST_DOCKER_NETWORK_GATEWAY` en `.env.test`.

## Preparación

En una instalación nueva, crear el archivo local a partir de la plantilla:

```powershell
Copy-Item .env.test.example .env.test
```

Cambiar como mínimo `DB_PASSWORD` y `DJANGO_SECRET_KEY`. Para probar llamadas
reales del chatbot también se debe configurar `OPENAI_API_KEY`.

## Operación

Levantar o reconstruir todo el entorno:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml up -d --build
```

Ver el estado:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml ps
```

Ver todos los logs:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml logs -f
```

Ver logs de un servicio:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml logs -f backend
docker compose --env-file .env.test -f docker-compose.test.yml logs -f frontend
```

Reconstruir solo backend o frontend:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml up -d --build backend
docker compose --env-file .env.test -f docker-compose.test.yml up -d --build frontend
```

Ejecutar comprobaciones de Django:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml exec backend python manage.py check
docker compose --env-file .env.test -f docker-compose.test.yml exec backend python manage.py test
```

Abrir una consola de Django:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml exec backend python manage.py shell
```

Detener temporalmente sin eliminar contenedores ni datos:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml stop
```

Volver a iniciar:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml start
```

Eliminar contenedores y red, conservando la base de pruebas:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml down
```

Reiniciar completamente la base de pruebas:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml down -v
docker compose --env-file .env.test -f docker-compose.test.yml up -d --build
```

`down -v` elimina únicamente los volúmenes del proyecto `sihul-test`, pero
borra de forma irreversible los datos almacenados en la base de pruebas.
