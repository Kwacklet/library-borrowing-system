# ---------- Stage 1: build the React app with Node.js ----------
FROM node:22-alpine AS build
WORKDIR /app
# Dependency list first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci
# Then the source code
COPY . .
# Jenkins passes the build number here; default is "dev"
ARG BUILD_NUMBER=dev
ENV VITE_BUILD_NUMBER=$BUILD_NUMBER
# Produces static files in /app/dist
RUN npm run build

# ---------- Stage 2: serve the static files with Nginx ----------
# Unprivileged Nginx image = runs as a non-root user, listens on 8080
FROM nginxinc/nginx-unprivileged:1.28-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy ONLY the built files from stage 1 (no Node.js, no source code)
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
