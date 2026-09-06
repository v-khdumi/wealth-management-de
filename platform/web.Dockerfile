# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc,required=false \
    if [ -f package-lock.json ]; then npm ci --include=dev; \
    else npm install --include=dev --package-lock=false; fi \
    && npm run build

FROM nginxinc/nginx-unprivileged:1.28-alpine AS runtime
COPY <<'NGINX' /etc/nginx/conf.d/default.conf
log_format privacy '$request_method $status $body_bytes_sent $request_time';
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    server_tokens off;
    access_log /dev/stdout privacy;
    error_log /dev/stderr warn;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy same-origin always;

    location = /healthz {
        access_log off;
        default_type text/plain;
        return 200 'ok\n';
    }
    location = /index.html {
        add_header Cache-Control 'no-cache';
        add_header X-Content-Type-Options nosniff always;
        add_header Referrer-Policy same-origin always;
    }
    location /assets/ {
        try_files $uri =404;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX
COPY --from=build --chown=101:101 /app/dist/ /usr/share/nginx/html/
USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
