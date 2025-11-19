FROM node:20-alpine
WORKDIR /app
ENV CHOKIDAR_USEPOLLING=true
# No copiamos código; se monta por volumen en compose
CMD ["sh", "-c", "if [ -f package-lock.json ] || [ -f pnpm-lock.yaml ] || [ -f yarn.lock ]; then if [ -f yarn.lock ]; then yarn install; elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; else npm install; fi; fi && if [ -f yarn.lock ]; then yarn dev; elif [ -f pnpm-lock.yaml ]; then pnpm run dev; else npm run dev; fi"]
