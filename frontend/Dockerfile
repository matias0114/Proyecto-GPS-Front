# Etapa 1: Compilar la app Angular
FROM node:20-alpine AS build

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --prod

# Etapa 2: Servir la app con Nginx
FROM nginx:alpine

# Copia el resultado del build Angular
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Configuración personalizada de Nginx (opcional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80