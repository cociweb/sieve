# Sieve Web Application

The ManageSieve protocol is incompatible with browsers directly. Browsers
communicate via HTTP and WebSockets, while ManageSieve uses a classic TCP socket.

The server-side Python proxy wraps ManageSieve in a WebSocket channel. Apache
serves the static UI and forwards `/config.json` and `/websocket/` to the proxy.

## Production (Docker)

Use the root `docker-compose.yml` or the published image `ghcr.io/thsmi/sieve`.
Apache terminates TLS; the Python proxy listens on `127.0.0.1:8765` inside the
container.

## Development

```bash
npx gulp web:package
cd src/web
python main.py --dev --config config.template.ini
```

`--dev` enables static file serving from `static/`. Without `--dev`, only API
routes are served (intended for use behind Apache).

## Configuration

Copy `config.template.ini` to `config.ini` and adjust account sections. See the
template comments for authentication modes (`client`, `token`, `authorization`).

In Docker, configuration is generated at container start from environment
variables (`DOVECOT_HOST`, `DOVECOT_PORT`, `AUTH_USER`). See
[docker/config/config.template.ini](../../docker/config/config.template.ini).

## Security

The WebSocket proxy acts as a trusted intermediary. Deploy behind HTTPS, use
Apache authentication or header injection for usernames, and do not expose the
Python proxy directly to the internet.

See [docker/apache/sieve-auth.conf.example](../../docker/apache/sieve-auth.conf.example)
for Apache authentication integration.
