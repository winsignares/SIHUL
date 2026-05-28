# 🐳 SIHUL - Stack Completo Dockerizado

## Sistema de Horarios Universidad Libre

[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://www.postgresql.org/)
[![Django](https://img.shields.io/badge/Django-Backend-092E20.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-Dev-646CFF.svg)](https://vitejs.dev/)

---

## 📋 Descripción

Este proyecto contiene **todo el stack de SIHUL** completamente dockerizado en una única red compartida:

- 🗄️ **PostgreSQL 15** - Base de datos
- 🔧 **Django** - Backend API REST
- ⚛️ **React + Vite** - Frontend SPA
- 🌐 **Red compartida** - Comunicación entre servicios

**Todo se ejecuta con un solo comando.**

---

## 🚀 Inicio Rápido

### Requisitos Previos

- ✅ Docker Desktop instalado
- ✅ Docker Compose instalado (incluido en Docker Desktop)

### Levantar Todo el Sistema

Desde la raíz del proyecto (`SIHUL/`):

```bash
docker compose up --build
```

Eso es todo. El sistema completo estará disponible en:

| Servicio | URL | Puerto |
|----------|-----|--------|
| 🎨 **Frontend** | http://localhost:5173 | 5173 |
| 🔧 **Backend API** | http://localhost:8000 | 8000 |
| 🗄️ **PostgreSQL** | localhost:5432 | 5432 |
| 🐘 **pgAdmin** | http://localhost:5050 | 5050 |

### Levantar Solo La Base De Datos

Si solo necesitas PostgreSQL (sin backend ni frontend), usando el `docker-compose.yml` principal:

```bash
docker compose up -d db
```

Comandos útiles:

```bash
# Ver logs de la base
docker compose logs -f db

# Entrar por psql a la base local
docker compose exec db psql -U postgres -d mypostgresdb

# Ejemplo de consulta
docker compose exec db psql -U postgres -d mypostgresdb -c "SELECT NOW();"

# Apagar solo la base
docker compose stop db
```

---

## 📦 Arquitectura del Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        SIHUL STACK                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────┐  │
│  │   FRONTEND   │    │   BACKEND    │    │  DATABASE   │  │
│  │              │    │              │    │             │  │
│  │  React+Vite  │───▶│    Django    │───▶│ PostgreSQL  │  │
│  │   Port 5173  │    │   Port 8000  │    │  Port 5432  │  │
│  └──────────────┘    └──────────────┘    └─────────────┘  │
│         │                    │                    │        │
│         └────────────────────┴────────────────────┘        │
│                     sihul_network                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Servicios Disponibles

### 1️⃣ Database (PostgreSQL)

- **Imagen:** `postgres:15`
- **Service:** `db`
- **Container:** `postgres_db`
- **Puerto:** `5432`
- **Credenciales:**
  - Usuario: `postgres`
  - Password: `mysecretpassword`
  - Database: `mypostgresdb`
- **Volumen persistente:** `sihul_postgres_data`
- **Healthcheck:** Activo cada 10s

### 2️⃣ Backend (Django)

- **Dockerfile:** `backend.Dockerfile`
- **Container:** `sihul_backend`
- **Puerto:** `8000`
- **Hot-reload:** ✅ Código montado como volumen
- **Migraciones:** Automáticas al iniciar
- **Depende de:** Database (espera healthcheck)
- **Variables de entorno:**
  ```env
  DB_HOST=db
  DB_NAME=mypostgresdb
  DB_USER=postgres
  DB_PASSWORD=mysecretpassword
  ```

### 3️⃣ pgAdmin

- **Imagen:** `dpage/pgadmin4:8`
- **Service:** `pgadmin`
- **Container:** `sihul-pgadmin`
- **Puerto:** `5050`
- **Acceso web:** `http://localhost:5050`
- **Credenciales:**
  - Email: `admin@sihul.com`
  - Password: `admin123`
- **Conexión al servidor PostgreSQL dentro de pgAdmin:**
  - Host: `db`
  - Port: `5432`
  - Username: `postgres`
  - Password: `mysecretpassword`
  - Database maintenance: `mypostgresdb`

### 4️⃣ Frontend (React + Vite)

- **Dockerfile:** `frontend.Dockerfile`
- **Container:** `sihul_frontend`
- **Puerto:** `5173`
- **Hot-reload:** ✅ HMR configurado
- **node_modules:** Solo en contenedor (volumen anónimo)
- **Depende de:** Backend
- **Variables de entorno:**
  ```env
  VITE_API_URL=http://localhost:8000
  VITE_USE_POLLING=true
  ```

---

## 📁 Estructura del Proyecto

```
SIHUL/
├── backend.Dockerfile          ← Dockerfile del backend
├── frontend.Dockerfile         ← Dockerfile del frontend
├── docker-compose.yml          ← Orquestación completa
├── .dockerignore              ← Archivos excluidos
├── README.Docker.md           ← Esta documentación
│
├── backend/                   ← Código Django
│   ├── manage.py
│   ├── requirements.txt
│   ├── mysite/
│   └── ...
│
└── frontend/                  ← Código React
    ├── package.json
    ├── vite.config.ts
    ├── src/
    └── ...
```

---

## 🎯 Comandos Útiles

### Gestión del Stack

```bash
# Iniciar todo (con build)
docker compose up --build

# Iniciar en segundo plano
docker compose up -d

# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f pgadmin

# Detener todo
docker compose down

# Detener y eliminar volúmenes (limpieza completa)
docker compose down -v
```

### Ejecutar Comandos en Servicios

```bash
# Backend - Django
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py shell
docker compose exec backend python manage.py collectstatic

# Frontend - NPM
docker compose exec frontend npm install paquete-nuevo
docker compose exec frontend npm run build
docker compose exec frontend npm run lint

# Database - PostgreSQL
docker compose exec db psql -U postgres -d mypostgresdb
```

### Abrir Terminal en Contenedores

```bash
# Backend
docker compose exec backend bash

# Frontend
docker compose exec frontend sh

# Database
docker compose exec db sh
```

### Inspeccionar Red

```bash
# Ver red compartida
docker network inspect sihul_network

# Ver IPs asignadas
docker network inspect sihul_network | Select-String "IPv4Address"
```

---

## 🔄 Workflow de Desarrollo

### Flujo Normal

1. **Iniciar el stack:**
   ```bash
   docker compose up
   ```

2. **Desarrollar:**
   - Edita archivos en `backend/` o `frontend/`
   - Los cambios se reflejan automáticamente (hot-reload)

3. **Ver cambios:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000

4. **Detener:**
   ```bash
   Ctrl + C
   docker compose down
   ```

### Agregar Dependencias

**Backend (Python):**
```bash
# Editar backend/requirements.txt
# Luego reconstruir
docker compose down
docker compose up --build
```

**Frontend (Node):**
```bash
docker compose exec frontend npm install nueva-libreria
# O editar frontend/package.json y rebuild
```

### Limpiar y Reconstruir

```bash
# Limpieza completa
docker compose down -v
docker system prune -a --volumes

# Rebuild desde cero
docker compose build --no-cache
docker compose up
```

---

## 🗄️ Base de Datos

### Acceso Directo

**Desde host:**
```bash
psql -h localhost -p 5432 -U postgres -d mypostgresdb
# Password: mysecretpassword
```

**Desde contenedor:**
```bash
docker compose exec db psql -U postgres -d mypostgresdb
```

### Backup y Restore

**Backup:**
```bash
docker compose exec db pg_dump -U postgres mypostgresdb > backup.sql
```

**Restore:**
```bash
cat backup.sql | docker compose exec -T db psql -U postgres -d mypostgresdb
```

---

## 🌐 Variables de Entorno

### Backend (`docker-compose.yml`)

```yaml
DJANGO_SECRET_KEY: "dev-secret-key-change-in-production"
DJANGO_DEBUG: "True"
DJANGO_ALLOWED_HOSTS: "localhost,127.0.0.1,backend"
DB_HOST: "db"
DB_NAME: "mypostgresdb"
DB_USER: "postgres"
DB_PASSWORD: "mysecretpassword"
DB_PORT: "5432"
```

### Frontend (`docker-compose.yml`)

```yaml
NODE_ENV: "development"
VITE_API_URL: "http://localhost:8000"
VITE_USE_POLLING: "true"
VITE_HMR_HOST: "localhost"
VITE_HMR_PORT: "5173"
```

### Database (`docker-compose.yml`)

```yaml
POSTGRES_DB: "mypostgresdb"
POSTGRES_USER: "postgres"
POSTGRES_PASSWORD: "mysecretpassword"
```

---

## 🐛 Troubleshooting

### El stack no inicia

```bash
# Ver logs detallados
docker compose logs

# Verificar puertos ocupados
netstat -ano | findstr "5173 8000 5432"

# Limpiar y reintentar
docker compose down -v
docker compose up --build
```

### Frontend no conecta con Backend

- Verifica que `VITE_API_URL=http://localhost:8000` esté configurado
- Asegúrate de que ambos servicios estén en la misma red (`sihul_network`)
- Revisa logs: `docker compose logs backend`

### Base de datos no acepta conexiones

```bash
# Verificar healthcheck
docker compose ps

# Ver logs de PostgreSQL
docker compose logs database

# Reiniciar solo la BD
docker compose restart database
```

### Hot-reload no funciona

- **Backend:** El volumen está montado, reinicia Django
- **Frontend:** Verifica que `VITE_USE_POLLING=true` esté configurado

### Error de permisos

```bash
# Windows - Verificar Docker Desktop
# Asegúrate de que la unidad esté compartida en Docker Desktop

# Linux - Ajustar permisos
sudo chown -R $USER:$USER .
```

---

## 📊 Monitoreo

### Ver Estado de Servicios

```bash
# Estado general
docker compose ps

# Recursos utilizados
docker stats

# Healthchecks
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

### Ver Logs en Tiempo Real

```bash
# Todos los servicios
docker compose logs -f

# Solo errores
docker compose logs -f | Select-String "error|ERROR|Error"
```

---

## 🚀 Despliegue a Producción

Para producción, modifica `docker-compose.yml`:

```yaml
# Cambiar a modo producción
NODE_ENV: "production"
DJANGO_DEBUG: "False"

# Usar builds optimizados
# Frontend: Multi-stage build con nginx
# Backend: Gunicorn en lugar de runserver

# Agregar secrets y volúmenes seguros
secrets:
  db_password:
    file: ./secrets/db_password.txt
```

---

## 📝 Notas Importantes

- ⚠️ **Nunca ejecutes `npm install` o `pip install` localmente** - Todo se maneja en contenedores
- ⚠️ Las credenciales son para **desarrollo** - Cámbialas en producción
- ✅ Los volúmenes de código permiten hot-reload sin rebuild
- ✅ `node_modules` se mantiene solo en contenedor (volumen anónimo)
- ✅ La base de datos persiste incluso si borras contenedores

---

## 🔐 Seguridad

**⚠️ IMPORTANTE PARA PRODUCCIÓN:**

1. Cambiar todas las contraseñas
2. Usar archivos `.env` en lugar de variables hardcodeadas
3. Configurar `DJANGO_SECRET_KEY` desde secrets
4. Habilitar HTTPS/SSL
5. Configurar firewall y restricciones de red
6. Usar imágenes oficiales verificadas

---

## 📚 Recursos

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Django Docker Guide](https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/)
- [Vite Backend Integration](https://vitejs.dev/guide/backend-integration.html)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agrega nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es parte del Sistema de Horarios de la Universidad Libre.

---

## 👥 Equipo

**Desarrollado por:** Equipo SIHUL  
**Universidad:** Universidad Libre  
**Año:** 2025

---

## 📞 Soporte

Si tienes problemas:

1. Revisa la sección **Troubleshooting**
2. Verifica los logs: `docker compose logs`
3. Limpia y reconstruye: `docker compose down -v && docker compose up --build`

---

**¡Listo para desarrollar! 🎉**

```bash
docker compose up --build
```
