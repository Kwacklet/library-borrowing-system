# Reverse proxy image: official unprivileged Nginx (non-root, port 8080)
FROM nginxinc/nginx-unprivileged:1.28-alpine
# Bake our routing rules into the image (no folder mounts needed)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
