# Build instructions

Gulp builds the web application from `src/common` (shared libraries), `src/web`
(static UI and Python proxy), and npm dependencies (Bootstrap, CodeMirror).

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Python](https://www.python.org/) 3.8+ (stdlib only, for the ManageSieve proxy)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

## Getting started

```bash
git clone https://github.com/thsmi/sieve.git
cd sieve
npm ci
```

Open the repository in [Visual Studio Code](https://code.visualstudio.com/) or use
the included [Dev Container](.devcontainer/devcontainer.json).

## Build the web UI

```bash
npx gulp web:package
```

Output is written to `build/web/static/`.

Watch mode for development:

```bash
npx gulp web:watch
```

## Local development (without Docker)

### Python proxy + static files

```bash
npx gulp web:package
cd src/web
python main.py --dev --config config.template.ini
```

In `--dev` mode the Python server serves static files and exposes `/config.json`
and `/websocket/` endpoints. Configure TLS certificate paths in `config.ini` if
you need HTTPS locally.

### Unit tests

```bash
npm test
npm run lint
```

## Docker deployment

Build and run the production stack (Apache + Python proxy):

```bash
docker compose up --build
```

- HTTP: http://localhost:8080 (redirects to HTTPS)
- HTTPS: https://localhost:8443

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DOVECOT_HOST` | `dovecot` | ManageSieve hostname (use with `--profile dev` or set to your server) |
| `DOVECOT_PORT` | `4190` | ManageSieve port |
| `AUTH_USER` | `user` | Fixed username for client-side authentication |
| `SIEVE_LOG_LEVEL` | `info` | Proxy log level (`debug`, `info`, `warning`) |
| `SSL_CERTIFICATE_FILE` | `/etc/apache2/certs/tls.crt` | Path to the TLS certificate (`.crt` or `.pem`) |
| `SSL_CERTIFICATE_KEY_FILE` | `/etc/apache2/certs/tls.key` | Path to the TLS private key (`.key` or `.pem`) |
| `SERVER_NAME` | *(from certificate or `sieve.local`)* | Apache `ServerName`; must match the certificate hostname |

### Apache TLS and authentication

TLS is terminated by Apache. Set `SSL_CERTIFICATE_FILE` and
`SSL_CERTIFICATE_KEY_FILE` to the **full paths inside the container** for your
certificate and key (any common extension works). Mount or copy the files to
those paths, for example:

```bash
SSL_CERTIFICATE_FILE=/etc/ssl/certs/fullchain.pem \
SSL_CERTIFICATE_KEY_FILE=/etc/ssl/private/privkey.pem \
docker compose run --rm \
  -v "$(pwd)/certs/fullchain.pem:/etc/ssl/certs/fullchain.pem:ro" \
  -v "$(pwd)/certs/privkey.pem:/etc/ssl/private/privkey.pem:ro" \
  websieve
```

Or in `docker-compose.yml`:

```yaml
environment:
  SSL_CERTIFICATE_FILE: /etc/ssl/certs/fullchain.pem
  SSL_CERTIFICATE_KEY_FILE: /etc/ssl/private/privkey.pem
volumes:
  - ./certs/fullchain.pem:/etc/ssl/certs/fullchain.pem:ro
  - ./certs/privkey.pem:/etc/ssl/private/privkey.pem:ro
```

If both variables keep the defaults and the files are missing, a self-signed
certificate is generated automatically (development only).

When you mount a real certificate, set `SERVER_NAME` to the hostname on the
certificate (for example `mail.example.com`). If omitted, the first DNS name or
common name from the certificate is used automatically.

Apache site configuration is rendered at startup from
[docker/apache/sieve.conf.template](docker/apache/sieve.conf.template).

For reverse-proxy or SSO authentication, see
[docker/apache/sieve-auth.conf.example](docker/apache/sieve-auth.conf.example).
The proxy reads the username from the `X-Forwarded-User` header (configurable
via `AuthUserHeader` in the Sieve config).

### Security headers

Apache sets HSTS, CSP, `X-Frame-Options`, and related headers. Basic output
rate limiting is enabled via `mod_ratelimit`. Tune values in
[docker/apache/sieve.conf.template](docker/apache/sieve.conf.template) for your deployment.

## Publish Docker image

Images are built and pushed to `ghcr.io/thsmi/sieve` by GitHub Actions on
push to `main`/`master` and on version tags (`v*`).

```bash
docker build -t ghcr.io/thsmi/sieve:local .
```

## Project layout

```
src/common/     Shared Sieve editor and ManageSieve protocol code
src/web/        Web UI (static/) and Python proxy (script/, main.py)
docker/         Apache config, entrypoint, Docker config templates
build/web/      Gulp output (generated)
```
