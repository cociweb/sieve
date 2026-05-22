# Stage 1: build frontend
FROM node:22-bookworm-slim AS build
WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx gulp web:package

# Stage 2: runtime (Python + Apache only)
FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    apache2 openssl \
    && a2enmod ssl headers proxy proxy_http proxy_wstunnel ratelimit rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /src/build/web/static /var/www/sieve
COPY src/web/script /opt/sieve/script
COPY src/web/main.py /opt/sieve/main.py
COPY docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf
COPY docker/apache/sieve.conf /etc/apache2/sites-available/sieve.conf
COPY docker/config/config.template.ini /etc/sieve/config.template.ini
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
    && a2dissite 000-default.conf 2>/dev/null || true

EXPOSE 80 443
ENTRYPOINT ["/entrypoint.sh"]
