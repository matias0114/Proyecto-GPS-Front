# Etapa 1: Build Angular
FROM node:20-alpine as build
WORKDIR /app
COPY . .  # copia desde dentro de /frontend
RUN npm install
RUN npm run build --prod

# Etapa 2: Servidor Nginx
FROM nginx:alpine
COPY --from=build /app/dist/frontend /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80