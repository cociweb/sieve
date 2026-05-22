# Sieve Editor

[Sieve](http://en.wikipedia.org/wiki/Sieve_%28mail_filtering_language%29) is a
powerful scripting language for server-side mail filtering. It is intended to
be used with [IMAP](http://tools.ietf.org/html/rfc3501) which is ubiquitous.
Many IMAP servers are capable of running Sieve filters. Sieve stores and runs
all scripts on the server-side.

This project provides a **web-only** ManageSieve client with a graphical editor
for [Sieve: An Email Filtering Language (RFC 5228)](https://tools.ietf.org/html/rfc5228),
implementing [A Protocol for Remotely Managing Sieve Scripts (RFC 5804)](https://tools.ietf.org/html/rfc5804).

![Sieve Editor showing a “Demo” script](https://user-images.githubusercontent.com/2531380/74590832-6efe1480-5012-11ea-8b4e-f7c3e8128824.png)

## Quick start with Docker

```bash
docker compose up --build
```

Open https://localhost:8443/ (accept the self-signed certificate on first run).

Point the container at your ManageSieve server:

```bash
DOVECOT_HOST=imap.example.com DOVECOT_PORT=4190 docker compose up --build
```

Pre-built images are published to [ghcr.io/thsmi/sieve](https://ghcr.io/thsmi/sieve).

### Local development stack (with Dovecot)

```bash
docker compose --profile dev up --build
```

## Architecture

- **Apache 2** — TLS termination, static UI, security headers, WebSocket reverse proxy
- **Python 3** (stdlib) — ManageSieve WebSocket proxy on `127.0.0.1:8765`
- **JavaScript** — browser UI (built with Node/Gulp at image build time)

See [BUILD.md](BUILD.md) and [src/web/README.md](src/web/README.md) for development and configuration details.

## Status

The project is actively developed as a standalone web application.

Status and future development plans are described in the [Roadmap](https://github.com/thsmi/sieve/wiki/Roadmap). The [Capabilities page](https://github.com/thsmi/sieve/wiki/Capabilities) lists supported Sieve and ManageSieve features.

A big thank you to everyone who has [contributed and supported](CONTRIBUTORS.md) the project.

## FAQ, Bugs and Contributing

Answers for [frequently asked questions](https://github.com/thsmi/sieve/wiki) can be found in the [Wiki section](https://github.com/thsmi/sieve/wiki). Please read those pages before raising a bug report.

For more details on contributing refer to the [Contributing Guidelines](CONTRIBUTING.md).

Bug reports: use the [issue tracker](https://github.com/thsmi/sieve/issues) or email `schmid-thomas at gmx.net`.

## License

The code is licensed under the [GNU Affero General Public License (AGPLv3)](http://www.fsf.org/licensing/licenses/agpl-3.0.html).

Refer to [LICENSING_INFO.md](LICENSING_INFO.md) for third-party license details.

## Releases

[GitHub Releases](https://github.com/thsmi/sieve/releases) and Docker tags (`ghcr.io/thsmi/sieve:v*`) are published on version tags.

## Continuous integration

[![CI](https://github.com/thsmi/sieve/actions/workflows/ci.yml/badge.svg)](https://github.com/thsmi/sieve/actions/workflows/ci.yml)

The graphical editor demo (no backend connection) is at https://thsmi.github.io/sieve-demo/.
