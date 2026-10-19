# 🎓 SIHUL - Sistema Integral de Horarios Universidad Libre

<div align="center">

![SIHUL Banner](https://img.shields.io/badge/SIHUL-Sistema_de_Horarios-blue?style=for-the-badge)

[![Django](https://img.shields.io/badge/Django-5.2.7-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

**Sistema completo de gestión académica para la Universidad Libre**

[📖 Documentación](#-documentación) • [🚀 Inicio Rápido](#-inicio-rápido) • [⚙️ Características](#️-características) • [🛠️ Tecnologías](#️-tecnologías)

</div>

---

## 📋 Descripción

**SIHUL** es un sistema integral de gestión académica diseñado para la Universidad Libre que permite la administración completa de horarios, recursos, espacios, préstamos y actividades académicas. Construido con tecnologías modernas y arquitectura escalable.

### ✨ Características Principales

- 📅 **Gestión de Horarios**: Creación, asignación y visualización de horarios académicos
- 🏢 **Administración de Espacios**: Control de aulas, laboratorios y recursos físicos
- 📚 **Sistema de Préstamos**: Gestión de préstamos de equipos y materiales
- 👥 **Gestión de Usuarios**: Control de acceso basado en roles (Admin, Coordinador, Docente, Estudiante)
- 🔔 **Notificaciones en Tiempo Real**: Sistema de alertas y notificaciones push
- 📊 **Reportes y Analíticas**: Generación de reportes en PDF y Excel
- 💬 **Chatbot Integrado**: Asistente virtual para consultas frecuentes
- 🌐 **Multi-sede**: Soporte para múltiples sedes y facultades
- 📱 **Diseño Responsivo**: Interfaz adaptable a todos los dispositivos
- 🐳 **Dockerizado**: Despliegue simplificado con Docker Compose

---

## 🛠️ Tecnologías

### Backend
- **Django 5.2.7** - Framework web de Python
- **Django REST Framework 3.15.2** - API RESTful
- **PostgreSQL 15** - Base de datos relacional
- **Gunicorn** - Servidor WSGI para producción
- **ReportLab** - Generación de PDFs
- **OpenPyXL** - Exportación a Excel

### Frontend
- **React 19.1.1** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Radix UI** - Componentes de UI accesibles
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide React** - Iconos modernos
- **Framer Motion** - Animaciones fluidas

### DevOps
- **Docker & Docker Compose** - Contenedorización
- **Nginx** - Servidor web para frontend
- **CORS Headers** - Configuración de seguridad

---

## 🚀 Inicio Rápido

### Requisitos Previos

- 🐳 Docker Desktop instalado
- 📦 Docker Compose (incluido en Docker Desktop)
- 💻 Git

### Instalación con Docker (Recomendado)

1. **Clonar el repositorio**
```bash
git clone https://github.com/winsignares/SIHUL.git
cd SIHUL
```

2. **Levantar todos los servicios**
```bash
docker compose up --build
```

3. **Acceder a la aplicación**
   - 🎨 **Frontend**: http://localhost:5173
   - 🔧 **Backend API**: http://localhost:8000
   - 📊 **Admin Django**: http://localhost:8000/admin

### Instalación Manual

<details>
<summary>Click para ver instrucciones de instalación manual</summary>

#### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

</details>

---

## 📁 Estructura del Proyecto

```
SIHUL/
├── 🔧 backend/                 # Django Backend
│   ├── mysite/                 # Configuración principal
│   ├── usuarios/               # Gestión de usuarios
│   ├── horario/                # Sistema de horarios
│   ├── espacios/               # Gestión de espacios
│   ├── prestamos/              # Sistema de préstamos
│   ├── notificaciones/         # Sistema de notificaciones
│   ├── chatbot/                # Asistente virtual
│   ├── asignaturas/            # Gestión de asignaturas
│   ├── grupos/                 # Gestión de grupos
│   ├── facultades/             # Gestión de facultades
│   ├── sedes/                  # Gestión de sedes
│   ├── periodos/               # Gestión de períodos
│   ├── programas/              # Gestión de programas
│   ├── recursos/               # Gestión de recursos
│   └── componentes/            # Componentes reutilizables
│
├── 🎨 frontend/                # React Frontend
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   ├── pages/              # Páginas de la aplicación
│   │   ├── services/           # Servicios y API calls
│   │   ├── context/            # Context API
│   │   ├── hooks/              # Custom hooks
│   │   ├── models/             # TypeScript interfaces
│   │   ├── layouts/            # Layouts de página
│   │   └── router/             # Configuración de rutas
│   └── public/                 # Archivos estáticos
│
├── 🐳 docker-compose.yml       # Orquestación de servicios
├── 📝 README.md                # Este archivo
└── 📚 docs/                    # Documentación adicional
```

---

## ⚙️ Características Detalladas

### 🔐 Sistema de Autenticación
- Login seguro con tokens JWT
- Roles y permisos granulares
- Recuperación de contraseña
- Gestión de sesiones

### 📅 Gestión de Horarios
- Creación de horarios académicos
- Asignación de docentes y espacios
- Detección de conflictos automática
- Vista de calendario interactiva
- Exportación a PDF y Excel

### 🏢 Gestión de Espacios
- Control de aulas y laboratorios
- Disponibilidad en tiempo real
- Reservas y asignaciones
- Capacidad y recursos

### 📚 Sistema de Préstamos
- Préstamo de equipos y materiales
- Control de inventario
- Historial de préstamos
- Notificaciones de devolución

### 🔔 Sistema de Notificaciones
- Notificaciones en tiempo real
- Badge con contador de no leídas
- Polling automático cada 30 segundos
- Historial completo de notificaciones

### 💬 Chatbot Inteligente
- Asistente virtual 24/7 con recuperación aumentada por generación (RAG)
- Consultas en lenguaje natural sobre los documentos cargados, separadas por chatbot y por sede
- Tecnologías: FastAPI, PostgreSQL + pgvector (embeddings), OpenAI (GPT-4o-mini), Redis opcional para cache
- Documentación técnica (arquitectura, ingesta, consulta, operación): [`documentacion/documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md`](documentacion/documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md)

---

## 🔧 Scripts Disponibles

### Backend
```bash
python manage.py migrate           # Aplicar migraciones
python manage.py createsuperuser   # Crear superusuario
python manage.py runserver         # Iniciar servidor desarrollo
```

### Frontend
```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run preview    # Preview del build
npm run lint       # Linter de código
```

### Docker
```bash
docker compose up --build          # Construir e iniciar
docker compose down                # Detener servicios
docker compose logs -f             # Ver logs en tiempo real
docker compose exec backend bash   # Acceder al contenedor backend
```

---

## 📖 Documentación

- 📘 [Documentación de Docker](./README.Docker.md)
- 🔔 [Sistema de Notificaciones](./RESUMEN_NOTIFICACIONES.md)
- 📱 [Actualizaciones Responsivas](./RESPONSIVE_UPDATES.md)
- 🔧 [Documentación Backend](./backend/unispace/notificaciones/README.md)

---

## 🎯 Módulos del Sistema

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| 👥 Usuarios | Gestión de usuarios y permisos | ✅ Completo |
| 📅 Horarios | Sistema de horarios académicos | ✅ Completo |
| 🏢 Espacios | Administración de espacios físicos | ✅ Completo |
| 📚 Préstamos | Gestión de préstamos | ✅ Completo |
| 🔔 Notificaciones | Sistema de alertas | ✅ Completo |
| 💬 Chatbot | Asistente virtual | ✅ Completo |
| 📊 Reportes | Generación de informes | ✅ Completo |
| 🎓 Asignaturas | Gestión de asignaturas | ✅ Completo |
| 👨‍🎓 Grupos | Gestión de grupos | ✅ Completo |
| 🏫 Facultades | Administración de facultades | ✅ Completo |

---

## 🔒 Roles y Permisos

- 👑 **Administrador**: Acceso completo al sistema
- 👨‍💼 **Coordinador**: Gestión de horarios y espacios
- 👨‍🏫 **Docente**: Consulta de horarios y solicitud de recursos
- 👨‍🎓 **Estudiante**: Consulta de horarios y préstamos

---

## 🌐 Variables de Entorno

Un solo archivo `.env` en la raiz del proyecto, leido tanto por `docker-compose.yml` (produccion) como por `docker-compose.test.yml` (pruebas) y por Vite (frontend). Copia `.env.example` (produccion) o `.env.test.example` (pruebas) a `.env` segun el entorno que vayas a levantar:

```
cp .env.example .env        # produccion
# o
cp .env.test.example .env   # pruebas
```

Incluye, entre otras: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `FRONTEND_URL`, credenciales de Microsoft OAuth, `OPENAI_API_KEY` (chatbot) y `VITE_API_URL`/`VITE_CHATBOT_URL`/`VITE_RECAPTCHA_SITE_KEY` (frontend). Ver `.env.example` para la lista completa.

---

## 🐳 Guía Docker

### 📦 Arquitectura del Stack

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

### 🔧 Servicios Disponibles

#### 1️⃣ Database (PostgreSQL)

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

#### 2️⃣ Backend (Django)

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

#### 3️⃣ pgAdmin

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

#### 4️⃣ Frontend (React + Vite)

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

### 📁 Estructura del Proyecto (vista desde Docker)

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

### 🎯 Comandos Útiles

#### Gestión del Stack

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

#### Ejecutar Comandos en Servicios

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

#### Abrir Terminal en Contenedores

```bash
# Backend
docker compose exec backend bash

# Frontend
docker compose exec frontend sh

# Database
docker compose exec db sh
```

#### Inspeccionar Red

```bash
# Ver red compartida
docker network inspect sihul_network

# Ver IPs asignadas
docker network inspect sihul_network | Select-String "IPv4Address"
```

---

### 🔄 Workflow de Desarrollo

#### Flujo Normal

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

#### Agregar Dependencias

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

#### Limpiar y Reconstruir

```bash
# Limpieza completa
docker compose down -v
docker system prune -a --volumes

# Rebuild desde cero
docker compose build --no-cache
docker compose up
```

---

### 🗄️ Base de Datos

#### Acceso Directo

**Desde host:**
```bash
psql -h localhost -p 5432 -U postgres -d mypostgresdb
# Password: mysecretpassword
```

**Desde contenedor:**
```bash
docker compose exec db psql -U postgres -d mypostgresdb
```

#### Backup y Restore

**Backup:**
```bash
docker compose exec db pg_dump -U postgres mypostgresdb > backup.sql
```

**Restore:**
```bash
cat backup.sql | docker compose exec -T db psql -U postgres -d mypostgresdb
```

---

### 🐛 Troubleshooting

#### El stack no inicia

```bash
# Ver logs detallados
docker compose logs

# Verificar puertos ocupados
netstat -ano | findstr "5173 8000 5432"

# Limpiar y reintentar
docker compose down -v
docker compose up --build
```

#### Frontend no conecta con Backend

- Verifica que `VITE_API_URL=http://localhost:8000` esté configurado
- Asegúrate de que ambos servicios estén en la misma red (`sihul_network`)
- Revisa logs: `docker compose logs backend`

#### Base de datos no acepta conexiones

```bash
# Verificar healthcheck
docker compose ps

# Ver logs de PostgreSQL
docker compose logs database

# Reiniciar solo la BD
docker compose restart database
```

#### Hot-reload no funciona

- **Backend:** El volumen está montado, reinicia Django
- **Frontend:** Verifica que `VITE_USE_POLLING=true` esté configurado

#### Error de permisos

```bash
# Windows - Verificar Docker Desktop
# Asegúrate de que la unidad esté compartida en Docker Desktop

# Linux - Ajustar permisos
sudo chown -R $USER:$USER .
```

---

### 📊 Monitoreo

#### Ver Estado de Servicios

```bash
# Estado general
docker compose ps

# Recursos utilizados
docker stats

# Healthchecks
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

#### Ver Logs en Tiempo Real

```bash
# Todos los servicios
docker compose logs -f

# Solo errores
docker compose logs -f | Select-String "error|ERROR|Error"
```

---

### 🚀 Despliegue a Producción

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

### 📝 Notas Importantes

- ⚠️ **Nunca ejecutes `npm install` o `pip install` localmente** - Todo se maneja en contenedores
- ⚠️ Las credenciales son para **desarrollo** - Cámbialas en producción
- ✅ Los volúmenes de código permiten hot-reload sin rebuild
- ✅ `node_modules` se mantiene solo en contenedor (volumen anónimo)
- ✅ La base de datos persiste incluso si borras contenedores

---

### 🔐 Seguridad

**⚠️ IMPORTANTE PARA PRODUCCIÓN:**

1. Cambiar todas las contraseñas
2. Usar archivos `.env` en lugar de variables hardcodeadas
3. Configurar `DJANGO_SECRET_KEY` desde secrets
4. Habilitar HTTPS/SSL
5. Configurar firewall y restricciones de red
6. Usar imágenes oficiales verificadas

---

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. 🍴 Fork el proyecto
2. 🌿 Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push a la rama (`git push origin feature/AmazingFeature`)
5. 🔄 Abre un Pull Request

---

## 📝 Licencia

Este proyecto es propiedad de la Universidad Libre.

---

## 👨‍💻 Autores

### 🎯 Líder de Proyecto
**Willian Ignacio Insignares Vanegas**
- GitHub: [@winsignares](https://github.com/winsignares)

### 💻 Equipo de Desarrollo

**Desarrollador 1**
- GitHub: [@Jfer178](https://github.com/Jfer178)

**Desarrollador 2**
- GitHub: [@armandod-perezb](https://github.com/armandod-perezb)

**Desarrollador 3**
- GitHub: [@HarlemHM](https://github.com/HarlemHM)

**Desarrollador 4**
- GitHub: [@GabrielDevCO](https://github.com/gabrieldevco)

**Desarrollador 5**
- GitHub: [@Andrewsy1004](https://github.com/Andrewsy1004)

**Desarrollador 6**
- GitHub: [@Llamas126](https://github.com/Llamas126)

---

## 📞 Soporte

¿Tienes preguntas o necesitas ayuda? 

- 📧 Contacto: soporte@unilibre.edu.co
- 📖 [Documentación completa](./docs)
- 🐛 [Reportar un bug](https://github.com/winsignares/SIHUL/issues)

---

<div align="center">

**Hecho con ❤️ para la Universidad Libre**

⭐ Si este proyecto te fue útil, considera darle una estrella

</div>
