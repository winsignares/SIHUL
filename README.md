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
- Asistente virtual 24/7
- Respuestas a preguntas frecuentes
- Integración con el sistema

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
- 🔧 [Documentación Backend](./backend/notificaciones/README.md)

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

El sistema utiliza las siguientes variables de entorno:

### Backend (`.env` en `/backend`)
```env
DEBUG=True
SECRET_KEY=tu-clave-secreta
DATABASE_URL=postgresql://usuario:password@localhost:5432/sihul
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend (`.env` en `/frontend`)
```env
VITE_API_URL=http://localhost:8000
```

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
