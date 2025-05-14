# Etapa 1: Build Angular
FROM node:20-alpine as build
WORKDIR /app
COPY ./frontend/ .
RUN npm install
RUN npm run build --prod

# Etapa 2: Servidor Nginx
FROM nginx:alpine
COPY --from=build /app/dist/* /usr/share/nginx/html
EXPOSE 80