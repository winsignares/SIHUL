# Corte de producción — guía paso a paso

Todo como `root` en el servidor, desde `/opt/sihul-repo`. Imagen a desplegar: la del commit fusionado en `main`
(etiqueta SHA corto, p. ej. `f1ba381`). **Nunca** se usa `down -v` ni se tocan los volúmenes `sihul_postgres_data`,
`sihul_media` y `sihul_redis_data`. Nunca deben estar arriba a la vez el stack viejo y el nuevo (comparten volumen).

## A. Antes de la ventana (sin impacto en producción)

1. Estado de las ramas y de las imágenes: PR a `main` fusionado y CI de `Build Images` en verde.
2. La imagen del frontend de producción lleva la clave pública de reCAPTCHA (no la de prueba de Google, que empieza por `6LeIxAc`):

   ```bash
   docker run --rm --entrypoint sh ghcr.io/winsignares/sihul-frontend:<TAG> -c "grep -rhoE '6L[A-Za-z0-9_-]{38}' /usr/share/nginx/html | sort -u"
   ```

3. Descargar las imágenes con antelación (así la ventana no depende de la red):

   ```bash
   for s in backend chatbot frontend; do docker pull ghcr.io/winsignares/sihul-$s:<TAG>; done
   ```

4. Validar `prod.env` contra el compose (no imprime nada si todo está bien; si falta una variable obligatoria, dice cuál):

   ```bash
   docker compose --env-file despliegue/env/prod.env -f despliegue/compose/docker-compose.yml config -q && echo "prod.env valido"
   ```

5. Comparar el nginx real con el del repositorio y revisar cada diferencia:

   ```bash
   diff /etc/nginx/sites-available/sihul despliegue/nginx/sihul.conf
   ```

6. Instalar el snippet de proxy que usa el nginx nuevo (un archivo nuevo; ningún sitio lo usa todavía, así que no cambia nada):

   ```bash
   cp despliegue/nginx/sihul-proxy.conf /etc/nginx/snippets/sihul-proxy.conf && nginx -t
   ```

7. Memoria libre y espacio en disco: `free -h` y `df -h /`.

## B. Ventana (se estima 1–2 minutos sin respuesta del backend)

Elegir una hora con pocos usuarios y sin la ETL (corre a las 05:00 hora local).

1. Confirmar que la ETL no está corriendo: `pgrep -af run_etl_completo || echo libre`.
2. Backup final, incluyendo los `.env` viejos:

   ```bash
   RUTAS_CONFIG="/etc/nginx /etc/sihul /opt/sihul /opt/sihul-repo/despliegue/env /root/ULlibre/SIHUL/.env /root/ULlibre/SIHUL/.env.db /root/ULlibre/SIHUL/chatbot/.env" bash despliegue/scripts/backup.sh
   ```

3. Copia del nginx actual para poder volver: `cp -a /etc/nginx/sites-available/sihul /root/sihul.nginx.bak`.
4. Liberar memoria: detener el stack de pruebas (no borra nada):
   `docker stop $(docker ps -q --filter label=com.docker.compose.project=sihul-test)`.
5. **Bajar el stack viejo** (aquí empieza la ventana; sin `-v`):

   ```bash
   cd /root/ULlibre/SIHUL && docker compose down
   ```

6. **Desplegar el nuevo** (migraciones + arranque + espera de salud):

   ```bash
   cd /opt/sihul-repo && bash despliegue/scripts/deploy.sh prod <TAG>
   ```

   Debe terminar con `OK — prod en <TAG>`. Si falla, ir a **Volver atrás**.
7. Instalar el nginx nuevo y recargar:

   ```bash
   cp despliegue/nginx/sihul.conf /etc/nginx/sites-available/sihul && nginx -t && systemctl reload nginx
   # (el snippet /etc/nginx/snippets/sihul-proxy.conf ya debe estar instalado: paso A6)
   ```

8. Verificar: `curl -s https://sihul.unilibre.edu.co/health/ready/`, entrar, iniciar sesión, preguntar al chatbot y
   `bash despliegue/scripts/verificar-nas.sh prod`.
9. Comprobar desde fuera que el certificado público no cambió (mismo número de serie que antes).

## C. Volver atrás (desde el paso B5 en adelante)

```bash
cd /opt/sihul-repo && docker compose --env-file despliegue/env/prod.env -f despliegue/compose/docker-compose.yml -p sihul down
cp -a /root/sihul.nginx.bak /etc/nginx/sites-available/sihul && nginx -t && systemctl reload nginx
cd /root/ULlibre/SIHUL && docker compose up -d db redis backend chatbot
```

Las migraciones nuevas solo agregan una tabla y un componente; el código viejo las ignora. Los datos son los mismos
porque el volumen es el mismo. Si algo hubiera dañado la base, restaurar el backup del paso B2.

## D. Después del corte

1. ETL de las 05:00: apuntarlo al compose nuevo y probarlo a mano.

   ```bash
   ln -s ../env/prod.env /opt/sihul-repo/despliegue/compose/.env
   sed -i 's|^PROJECT_DIR=.*|PROJECT_DIR="/opt/sihul-repo/despliegue/compose"|' /etc/sihul/etl.env
   cd /opt/sihul-repo/despliegue/compose && docker compose exec -T backend python manage.py check
   ```

   Luego ejecutar `/opt/sihul/run_etl_completo.sh` a mano en una hora tranquila y revisar su registro en `/var/log/sihul-etl/`.
2. Los nombres de contenedor cambian (`sihul-backend-1`, `sihul-db-1`...): cualquier comando manual con `docker exec <nombre>` debe actualizarse.
3. Borrar la base de pruebas, que tiene una copia de datos reales: `docker compose -p sihul-test down -v`
   (solo el proyecto `sihul-test`) cuando termine el ensayo.
4. Dejar el stack viejo (`/root/ULlibre/SIHUL`) sin tocar unos días como respaldo; no volver a levantarlo a la vez que el nuevo.
