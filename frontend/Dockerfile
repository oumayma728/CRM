# =============================================================================
# CRM AI Frontend - Dockerfile (Multi-stage)
# =============================================================================
# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copier les fichiers de dépendances pour bénéficier du cache Docker
COPY package*.json .
RUN npm ci && npm cache clean --force

# Copier le reste du code source
COPY . .
# VITE_API_URL vide = même origine (nginx proxifie /api, /ws et /hubs vers le backend)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# =============================================================================
# Runtime stage - Nginx
FROM nginx:alpine

# Copier les fichiers statiques buildés
COPY --from=build /app/dist /usr/share/nginx/html

# Configuration nginx : template résolu au démarrage (BACKEND_URL)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV BACKEND_URL=http://backend:5000

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]