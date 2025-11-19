# ============================================
# DOCKERFILE PARA FRONTEND REACT + VITE
# Modo: Desarrollo con todo autocontenido
# ============================================

FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Variables de entorno para optimización
ENV NODE_ENV=development \
    CHOKIDAR_USEPOLLING=true \
    VITE_USE_POLLING=true

# Instalar dependencias del sistema (git puede ser útil para algunas dependencias)
RUN apk add --no-cache git

# Copiar archivos de dependencias primero (mejor cache de Docker)
COPY package*.json ./

# Instalar dependencias de Node.js
# --prefer-offline: usa cache local si está disponible
# --no-audit: más rápido, sin revisar vulnerabilidades en dev
RUN npm ci --prefer-offline --no-audit

# Copiar el resto del código fuente
COPY . .

# Exponer puerto del servidor de desarrollo Vite
EXPOSE 5173

# Comando para iniciar el servidor de desarrollo
# Vite ya está configurado con host: true en vite.config.ts
CMD ["npm", "run", "dev"]
