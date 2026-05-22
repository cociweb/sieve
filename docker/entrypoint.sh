#!/bin/sh
set -e

CERT_DIR="/etc/apache2/certs"
CONFIG_FILE="/etc/sieve/config.ini"
CONFIG_TEMPLATE="/etc/sieve/config.template.ini"

mkdir -p "$CERT_DIR" /etc/sieve

if [ ! -f "$CERT_DIR/tls.crt" ] || [ ! -f "$CERT_DIR/tls.key" ]; then
  echo "Generating self-signed TLS certificate..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/tls.key" \
    -out "$CERT_DIR/tls.crt" \
    -subj "/CN=sieve.local/O=Sieve/C=US"
fi

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
