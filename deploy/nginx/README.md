# nginx — configuración de producción (VPS)

`sihul.unilibre.edu.co` corre nginx como **servicio nativo del sistema** en el VPS (no está containerizado). Este archivo (`sihul.conf`) es la fuente de verdad versionada; el VPS tiene una copia en `/etc/nginx/sites-available/`.

## Aplicar un cambio en el VPS

```bash
# 1. Traer el repo actualizado en el VPS (checkout de main/develop según corresponda)
git pull

# 2. Copiar el archivo a donde nginx lo lee
sudo cp deploy/nginx/sihul.conf /etc/nginx/sites-available/sihul.conf

# 3. (Solo la primera vez) habilitar el site
sudo ln -s /etc/nginx/sites-available/sihul.conf /etc/nginx/sites-enabled/sihul.conf

# 4. Validar sintaxis antes de recargar
sudo nginx -t

# 5. Recargar sin downtime
sudo systemctl reload nginx
```

## Qué asume este config

- Build estático del frontend (Vite) copiado a `/var/www/sihul/` (`index.html`, `assets/`).
- `collectstatic` del backend copiado a `/var/www/sihul/static/`.
- `backend` (Django/Gunicorn) escuchando en `127.0.0.1:8000`.
- `chatbot` (FastAPI) escuchando en `127.0.0.1:8001`.
- Certificados de Let's Encrypt en `/etc/letsencrypt/live/sihul.unilibre.edu.co/` (gestionados por `certbot`, ya instalado en el VPS).

## Por qué no está containerizado (por ahora)

Containerizar nginx como servicio de `docker-compose` (reverse proxy interno, sin publicar puertos de `backend`/`chatbot` al host) es una mejora válida a futuro, pero implica resolver el manejo de TLS/certbot dentro de ese esquema y probarlo en un VPS compartido con otros servicios. Se evaluó y se decidió posponer: por ahora se prioriza la organización del archivo (sacarlo de `backend/` a esta carpeta de infraestructura) sin tocar cómo corre en producción.
