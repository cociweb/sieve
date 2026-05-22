#!/bin/sh
set -e

CONFIG_FILE="/etc/sieve/config.ini"
APACHE_TEMPLATE="/etc/apache2/sites-available/sieve.conf.template"
APACHE_SITE="/etc/apache2/sites-available/sieve.conf"

DEFAULT_CERT_FILE="/etc/apache2/certs/tls.crt"
DEFAULT_KEY_FILE="/etc/apache2/certs/tls.key"

SSL_CERTIFICATE_FILE="${SSL_CERTIFICATE_FILE:-$DEFAULT_CERT_FILE}"
SSL_CERTIFICATE_KEY_FILE="${SSL_CERTIFICATE_KEY_FILE:-$DEFAULT_KEY_FILE}"

mkdir -p /etc/ssl/certs /etc/ssl/private /etc/apache2/certs \
  "$(dirname "$SSL_CERTIFICATE_FILE")" "$(dirname "$SSL_CERTIFICATE_KEY_FILE")" \
  /etc/sieve

using_defaults=false
if [ "$SSL_CERTIFICATE_FILE" = "$DEFAULT_CERT_FILE" ] \
  && [ "$SSL_CERTIFICATE_KEY_FILE" = "$DEFAULT_KEY_FILE" ]; then
  using_defaults=true
fi

if [ ! -f "$SSL_CERTIFICATE_FILE" ] || [ ! -f "$SSL_CERTIFICATE_KEY_FILE" ]; then
  if [ "$using_defaults" = true ]; then
    echo "Generating self-signed TLS certificate at $SSL_CERTIFICATE_FILE and $SSL_CERTIFICATE_KEY_FILE ..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout "$SSL_CERTIFICATE_KEY_FILE" \
      -out "$SSL_CERTIFICATE_FILE" \
      -subj "/CN=sieve.local/O=Sieve/C=US"
  else
    echo "ERROR: TLS certificate file(s) not found." >&2
    echo "  SSL_CERTIFICATE_FILE=$SSL_CERTIFICATE_FILE ($([ -f "$SSL_CERTIFICATE_FILE" ] && echo exists || echo missing))" >&2
    echo "  SSL_CERTIFICATE_KEY_FILE=$SSL_CERTIFICATE_KEY_FILE ($([ -f "$SSL_CERTIFICATE_KEY_FILE" ] && echo exists || echo missing))" >&2
    exit 1
  fi
fi

echo "Using TLS certificate: $SSL_CERTIFICATE_FILE"
echo "Using TLS private key: $SSL_CERTIFICATE_KEY_FILE"

sed \
  -e "s|__SSL_CERTIFICATE_FILE__|${SSL_CERTIFICATE_FILE}|g" \
  -e "s|__SSL_CERTIFICATE_KEY_FILE__|${SSL_CERTIFICATE_KEY_FILE}|g" \
  "$APACHE_TEMPLATE" > "$APACHE_SITE"

SIEVE_HOST="${DOVECOT_HOST:-dovecot}"
SIEVE_PORT="${DOVECOT_PORT:-4190}"

case "$SIEVE_HOST" in
  http://*) SIEVE_HOST="${SIEVE_HOST#http://}" ;;
  https://*) SIEVE_HOST="${SIEVE_HOST#https://}" ;;
esac

SIEVE_HOST="${SIEVE_HOST%%/*}"
SIEVE_HOST="${SIEVE_HOST%%:*}"

AUTH_USER="${AUTH_USER:-user}"
VERBOSE="${SIEVE_LOG_LEVEL:-info}"

cat > "$CONFIG_FILE" <<EOF
[DEFAULT]

ServerPort = 8765
ServerAddress = 127.0.0.1

[Default Account]

SieveHost = ${SIEVE_HOST}
SievePort = ${SIEVE_PORT}
AuthType = client
AuthUser = ${AUTH_USER}
AuthUserHeader = X-Forwarded-User
EOF

a2dissite 000-default.conf 2>/dev/null || true
a2ensite 000-default.conf
a2ensite sieve.conf

case "$VERBOSE" in
  debug) PY_VERBOSE="-vvv" ;;
  warning) PY_VERBOSE="" ;;
  *) PY_VERBOSE="-v" ;;
esac

cd /opt/sieve
python main.py --config "$CONFIG_FILE" --host 127.0.0.1 --port 8765 $PY_VERBOSE &
PROXY_PID=$!

trap 'kill "$PROXY_PID" 2>/dev/null; exit' TERM INT

exec apache2ctl -D FOREGROUND
