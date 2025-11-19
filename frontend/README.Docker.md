# 🐳 Docker - Frontend SIHUL

## 📋 Descripción

Este frontend React + Vite está completamente dockerizado. **Todo el entorno de desarrollo corre dentro del contenedor**, incluyendo Node.js, dependencias y node_modules.

**No necesitas tener Node.js instalado en tu máquina local.**

---

## 🚀 Inicio Rápido

### 1️⃣ Levantar el contenedor

```bash
docker compose up --build
```

Eso es todo. El frontend estará disponible en:
- **http://localhost:5173**

### 2️⃣ Detener el contenedor

```bash
# Detener y eliminar contenedores
docker compose down

# Detener, eliminar contenedores Y volúmenes (limpieza completa)
docker compose down -v
```

---

## 📦 ¿Qué incluye el contenedor?

✅ **Node.js 20 Alpine** - Ligero y rápido  
✅ **Todas las dependencias** - Se instalan automáticamente  
✅ **node_modules interno** - NO se comparte con tu máquina  
✅ **Hot Module Replacement (HMR)** - Los cambios se reflejan automáticamente  
✅ **Vite Dev Server** - Optimizado para desarrollo  
✅ **File watching** - Detecta cambios con polling (Windows compatible)  

---

## 🔧 Comandos Útiles

### Ver logs del contenedor
```bash
docker compose logs -f frontend
```

### Ejecutar comandos NPM dentro del contenedor
```bash
# Instalar nueva dependencia
docker compose exec frontend npm install nombre-paquete

# Ejecutar build
docker compose exec frontend npm run build

# Ejecutar linter
docker compose exec frontend npm run lint
```

### Abrir terminal dentro del contenedor
```bash
docker compose exec frontend sh
```

### Reconstruir desde cero
```bash
# Si cambias package.json o necesitas limpiar cache
docker compose down -v
docker compose build --no-cache
docker compose up
```

---

## 📂 Estructura de Volúmenes

El contenedor usa dos volúmenes:

1. **Código fuente montado** (`.:/app`)
   - Tus cambios locales se reflejan en el contenedor
   - El HMR funciona automáticamente

2. **node_modules anónimo** (`/app/node_modules`)
   - Se crea SOLO dentro del contenedor
   - NO se comparte con tu máquina local
   - Evita conflictos entre Windows y Linux

---

## ⚙️ Variables de Entorno

Configuradas en `docker-compose.yml`:

```yaml
NODE_ENV=development           # Modo desarrollo
CHOKIDAR_USEPOLLING=true      # Polling para Windows + Docker
VITE_USE_POLLING=true         # Polling específico de Vite
VITE_HMR_HOST=localhost       # Host para Hot Module Replacement
VITE_HMR_PORT=5173            # Puerto HMR
```

---

## 🐛 Troubleshooting

### El contenedor no inicia
```bash
# Ver logs detallados
docker compose logs frontend

# Verificar que el puerto 5173 no esté ocupado
netstat -ano | findstr :5173
```

### Los cambios no se reflejan
- Verifica que `VITE_USE_POLLING=true` esté configurado
- Reinicia el contenedor: `docker compose restart frontend`

### Error de permisos en Windows
- Asegúrate de tener Docker Desktop corriendo
- Verifica que la carpeta esté en la unidad compartida de Docker

### Quiero limpiar todo y empezar de cero
```bash
docker compose down -v
docker system prune -a --volumes
docker compose up --build
```

---

## 🎯 Diferencias con Desarrollo Local

| Aspecto | Desarrollo Local | Con Docker |
|---------|------------------|------------|
| Node.js | Requiere instalación | Incluido en contenedor |
| node_modules | En tu máquina | Solo en contenedor |
| Dependencias | `npm install` local | Automático en build |
| Puerto | 5173 local | 5173 mapeado desde contenedor |
| HMR | Nativo | Via polling (Windows) |
| Compatibilidad | Depende de tu OS | Consistente (Linux Alpine) |

---

## 📝 Notas Importantes

- ⚠️ **NO ejecutes `npm install` localmente** - Todo se maneja en el contenedor
- ⚠️ **NO borres el volumen de node_modules** sin rebuild
- ✅ Puedes editar código normalmente, los cambios se detectan automáticamente
- ✅ Todos los archivos de configuración (vite.config.ts, etc.) funcionan sin cambios

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────┐
│     Tu Máquina (Windows)            │
│                                     │
│  ┌──────────────────────────┐      │
│  │  Código Fuente           │      │
│  │  (montado como volumen)  │      │
│  └──────────────────────────┘      │
│              ↕                      │
│  ┌─────────────────────────────┐   │
│  │  Docker Container           │   │
│  │  ┌───────────────────────┐ │   │
│  │  │ Node.js 20 Alpine     │ │   │
│  │  │ node_modules (interno)│ │   │
│  │  │ Vite Dev Server       │ │   │
│  │  └───────────────────────┘ │   │
│  │         Puerto 5173        │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
              ↕
       http://localhost:5173
```

---

## 📚 Referencias

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Vite Docker Guide](https://vitejs.dev/guide/backend-integration.html)
- [Node Alpine Image](https://hub.docker.com/_/node)

---

**Creado para:** SIHUL - Sistema de Horarios Universidad Libre  
**Fecha:** Noviembre 2025  
**Versión:** 1.0.0
