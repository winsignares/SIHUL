# ============================================
# FRONTEND REACT — BUILD ESTÁTICO + NGINX
# Contexto de build: raíz del repositorio
#   docker build -f despliegue/docker/frontend.prod.Dockerfile -t sihul-frontend:TAG .
# Reemplaza el copiado a mano del build a /var/www/sihul.
# VITE_API_URL vacío = URLs relativas (/api), que enruta el nginx del servidor.
# ============================================

FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit
COPY frontend/ .
ARG VITE_API_URL=""
ARG VITE_CHATBOT_URL=""
ARG VITE_RECAPTCHA_SITE_KEY=""
ENV VITE_API_URL=$VITE_API_URL \
    VITE_CHATBOT_URL=$VITE_CHATBOT_URL \
    VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY
RUN npm run build


FROM nginx:1.27-alpine
COPY despliegue/docker/nginx-frontend.conf /etc/nginx/conf.d/default.conf
COPY despliegue/docker/nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
# /static/ (admin y allauth de Django) llega por un volumen compartido con el backend.
RUN mkdir -p /usr/share/nginx/html/static
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/healthz || exit 1
