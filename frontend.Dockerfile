# ============================================
# DOCKERFILE - FRONTEND REACT + VITE
# ============================================

FROM node:20-alpine

# Variables de entorno
ENV NODE_ENV=development \
    CHOKIDAR_USEPOLLING=true \
    VITE_USE_POLLING=true

# Directorio de trabajo
WORKDIR /app

# Instalar git (útil para algunas dependencias npm)
RUN apk add --no-cache git

# Copiar archivos de dependencias
COPY frontend/package*.json ./

# Instalar dependencias
RUN npm ci --prefer-offline --no-audit

# Copiar código del frontend
COPY frontend/ .

# Exponer puerto Vite
EXPOSE 5173

# Iniciar servidor de desarrollo
CMD ["npm", "run", "dev"]
