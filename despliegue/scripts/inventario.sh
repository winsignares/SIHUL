#!/usr/bin/env bash
# =============================================================================
# inventario.sh — Fotografía del estado del servidor. SOLO LECTURA.
# Escribe /root/inventario-sihul-<fecha>.txt (permisos 600). Enmascara contraseñas y de los
# archivos .env solo muestra los NOMBRES de las variables. Revisa el archivo antes de compartirlo.
#   bash despliegue/scripts/inventario.sh && less /root/inventario-sihul-*.txt
# =============================================================================
set -u
FECHA="$(date +%Y%m%d-%H%M%S)"
SALIDA="${SALIDA:-/root/inventario-sihul-${FECHA}.txt}"
export DBC="${DB_CONTAINER:-postgres_db}" RDC="${REDIS_CONTAINER:-sihul-redis}" DOMINIO="${DOMINIO:-sihul.unilibre.edu.co}"
umask 077

enmascarar() {
  sed -E 's/((PASSWORD|PASSWD|SECRET|TOKEN|API_?KEY|PRIVATE|CREDENTIAL)[A-Za-z_]*[[:space:]]*[=:][[:space:]]*).*/\1<oculto>/I; s#(://[^/@[:space:]]+):[^/@[:space:]]+@#\1:<oculto>@#g'
}
sec() { echo; echo "=================== $1 ==================="; }
run() { local d="$1"; shift; echo "--- $d"; bash -c "$1" 2>&1; }
run2() { echo "--- $1"; shift; "$@" 2>&1; }
pg() { docker exec "$DBC" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -X -c "$0"' "$1"; }

# Las etiquetas de Compose se leen con docker inspect (en "docker ps --format" .Labels es texto, no mapa).
etiqueta() { docker inspect -f "{{index .Config.Labels \"$2\"}}" "$1" 2>/dev/null; }
compose_dirs() { for c in $(docker ps -aq); do etiqueta "$c" com.docker.compose.project.working_dir; done | sort -u | grep -v '^$'; }
compose_archivos() { for c in $(docker ps -aq); do etiqueta "$c" com.docker.compose.project.config_files; done | tr ',' '\n' | sort -u | grep -v '^$'; }
export -f etiqueta compose_dirs compose_archivos

{
sec "GENERAL"
run "Fecha, host y tiempo encendido" 'date; hostname; uptime -p; lsb_release -ds 2>/dev/null; uname -r; systemd-detect-virt'
run "Reinicio y actualizaciones pendientes" '[ -f /var/run/reboot-required ] && echo "REINICIO PENDIENTE"; apt list --upgradable 2>/dev/null | tail -n +2 | wc -l'

sec "RECURSOS"
run "CPU" 'lscpu | grep -E "Model name|^CPU\(s\)"'
run "Memoria" 'free -h'
run "Disco y volúmenes lógicos" 'df -hT -x tmpfs -x devtmpfs -x overlay; lsblk -o NAME,SIZE,TYPE,MOUNTPOINT; vgs 2>&1; lvs 2>&1'
run "Procesos que más memoria usan" 'ps aux --sort=-%mem | head -10 | cut -c1-170'
run "Consumo actual por contenedor" 'docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"'

sec "RED, PUERTOS Y SALIDA A INTERNET"
run "Interfaces y rutas" 'ip -brief addr; ip route'
run "Puertos en escucha" 'ss -tlnp | awk "{print \$1,\$4,\$6}"'
run "Firewall" 'ufw status verbose 2>&1; iptables -S DOCKER-USER 2>&1'
run "Cómo resuelve el servidor el dominio" 'getent hosts "$DOMINIO"; resolvectl status 2>/dev/null | head -12'
run "IP pública de salida del servidor" 'curl -s -m 8 https://api.ipify.org; echo'
run "Acceso a GitHub y registros de imágenes" 'for u in https://github.com https://ghcr.io/v2/ https://registry-1.docker.io/v2/; do printf "%s -> " "$u"; curl -s -o /dev/null -m 8 -w "%{http_code}\n" "$u"; done'
run "Quién llega a nginx: IPs de origen más frecuentes (últimas 5000)" 'tail -n 5000 /var/log/nginx/access.log | awk "{print \$1}" | sort | uniq -c | sort -rn | head -10'
run "Rutas más pedidas, sin parámetros (últimas 5000)" 'tail -n 5000 /var/log/nginx/access.log | awk "{print \$7}" | cut -d"?" -f1 | sort | uniq -c | sort -rn | head -15'
run "Conexiones activas directas a puertos de la app" 'ss -tn state established "( sport = :8000 or sport = :8001 or sport = :5432 or sport = :5173 )"'

sec "NGINX Y CERTIFICADOS"
run "nginx: versión y sintaxis" 'nginx -v 2>&1; nginx -t 2>&1'
run "nginx: sitios habilitados" 'ls -la /etc/nginx/sites-enabled /etc/nginx/conf.d 2>&1'
run "nginx: configuración completa de los sitios" 'for f in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do [ -f "$f" ] && { echo "##### $f"; cat "$f"; }; done'
run "Certbot y renovación" 'certbot certificates 2>&1; ls -la /etc/letsencrypt/live /etc/letsencrypt/renewal 2>&1; systemctl list-timers --no-pager 2>&1 | grep -i certbot'
run "Certificados que usa nginx: emisor y vigencia" 'for c in $(nginx -T 2>/dev/null | grep -E "^\s*ssl_certificate " | awk "{print \$2}" | tr -d ";" | sort -u); do echo "## $c"; openssl x509 -in "$c" -noout -issuer -subject -dates 2>&1; done'
run "Certificado que realmente se sirve en 443" 'echo | openssl s_client -connect 127.0.0.1:443 -servername "$DOMINIO" 2>/dev/null | openssl x509 -noout -issuer -subject -dates -ext subjectAltName'

sec "DOCKER: CÓMO ESTÁ DESPLEGADA LA APLICACIÓN"
run "Versiones" 'docker --version; docker compose version; cat /etc/docker/daemon.json 2>&1'
run "Proyectos Compose, carpetas y archivos" 'docker compose ls -a 2>&1; for c in $(docker ps -aq); do echo "$(docker inspect -f "{{.Name}}" $c) | proyecto=$(etiqueta $c com.docker.compose.project) | carpeta=$(etiqueta $c com.docker.compose.project.working_dir)"; done'
run "Contenedores" 'docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"'
run "Detalle por contenedor" 'for c in $(docker ps -aq); do docker inspect -f "{{.Name}} | imagen={{.Config.Image}} | usuario={{.Config.User}} | restart={{.HostConfig.RestartPolicy.Name}} | mem={{.HostConfig.Memory}} | red={{.HostConfig.NetworkMode}}" $c; docker inspect -f "   montajes: {{range .Mounts}}[{{.Type}}] {{if .Name}}{{.Name}}{{else}}{{.Source}}{{end}} -> {{.Destination}}; {{end}}" $c; done'
run "Contenido de los compose en uso (secretos enmascarados)" 'for f in $(compose_archivos); do [ -f "$f" ] && { echo "##### $f"; cat "$f"; }; done'
run "Variables de los .env (SOLO nombres)" 'for d in $(compose_dirs); do for e in "$d"/.env "$d"/.env.* "$d"/chatbot/.env; do [ -f "$e" ] && { echo "##### $e"; sed -E "s/=.*/=<oculto>/; /^[[:space:]]*#/d; /^[[:space:]]*\$/d" "$e"; }; done; done'
run "Redes" 'docker network ls; docker network inspect -f "{{.Name}} {{range .IPAM.Config}}{{.Subnet}} {{end}}" $(docker network ls -q)'
run "Volúmenes: dueño, ruta y tamaño" 'for v in $(docker volume ls -q); do docker volume inspect -f "{{.Name}} | proyecto={{index .Labels \"com.docker.compose.project\"}} | {{.Mountpoint}}" $v; du -sh "$(docker volume inspect -f "{{.Mountpoint}}" $v)" 2>/dev/null; done'
run "Imágenes y uso de disco de Docker" 'docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedSince}}\t{{.Size}}"; docker system df'

sec "CÓDIGO DESPLEGADO Y TAREAS PROGRAMADAS"
run "Git de cada carpeta de trabajo" 'for d in $(compose_dirs); do [ -d "$d/.git" ] && { echo "## $d"; git -c "safe.directory=*" -C "$d" log -1 --format="commit=%h fecha=%ad asunto=%s" --date=short; git -c "safe.directory=*" -C "$d" branch --show-current; git -c "safe.directory=*" -C "$d" status --short | head -10; }; done'
run "Cron de root" 'crontab -l 2>&1 | grep -v "^#"; ls /etc/cron.d'
run "Configuración del ETL (solo carpeta y servicio)" 'grep -E "^(PROJECT_DIR|DOCKER_SERVICE)=" /etc/sihul/etl.env 2>&1'

sec "POSTGRES (contenedor ${DBC}) — LA BASE QUE SE DEBE CONSERVAR"
run2 "Versión del motor" pg "select version();"
run "Versión de los datos en disco" 'docker exec "$DBC" cat /var/lib/postgresql/data/PG_VERSION'
run2 "Base, usuario y tamaño" pg "select current_database() as base, current_user as usuario, pg_size_pretty(pg_database_size(current_database())) as tamano;"
run2 "Extensiones" pg "select extname, extversion from pg_extension;"
run2 "Tablas más grandes" pg "select relname as tabla, n_live_tup as filas, pg_size_pretty(pg_total_relation_size(relid)) as tamano from pg_stat_user_tables order by pg_total_relation_size(relid) desc limit 15;"
run2 "Últimas migraciones aplicadas" pg "select app, name, applied from django_migrations order by id desc limit 5;"

sec "BACKUPS EXISTENTES"
run "Carpetas habituales" 'ls -la /var/backups/sihul /root/backups /opt/backups 2>&1 | head -30'
} 2>&1 | enmascarar > "$SALIDA"

echo "Listo: $SALIDA ($(wc -c < "$SALIDA") bytes). Revisa el contenido antes de compartirlo."
