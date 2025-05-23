# Etapa 1: Build Angular
FROM node:20-alpine AS build
WORKDIR /app
COPY ./frontend/ .  # Asume que el código Angular está en /frontend
RUN npm install
RUN npm run build  # No uses --prod si ya está definido por defecto como production

# Etapa 2: Servidor Nginx
FROM nginx:alpine
COPY --from=build /app/dist/frontend /usr/share/nginx/html
COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80