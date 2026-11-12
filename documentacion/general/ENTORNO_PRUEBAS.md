# Entorno de pruebas SIHUL

El entorno de pruebas es el **proyecto Compose `sihul-test`** del despliegue (mismo `docker-compose.yml` que producción, otras
imágenes, otra base de datos y otro puerto). Ya no existe el `docker-compose.test.yml` de la raíz.

- **Dónde:** `http://10.4.100.146:5273` (red interna). Variables en `despliegue/env/test.env` (plantilla: `test.env.example`).
- **Imagen:** la etiqueta `develop`, es decir, lo último fusionado a `develop`.
- **Cómo actualizarlo:** `bash despliegue/scripts/deploy.sh test develop`,
  ver `despliegue/README.md`.
- **Datos:** base vacía; para datos de demostración, `python manage.py seed_initial_data` dentro del contenedor del backend
  (crea usuarios con contraseñas de ejemplo: solo para pruebas, nunca exponer fuera de la red interna).
- **Desarrollo local** (código montado con recarga en caliente): `docker-compose.yml` de la raíz, ver `README.Docker.md`.
