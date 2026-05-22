#!/bin/sh
set -e

CONFIG_FILE="/etc/sieve/config.ini"
APACHE_TEMPLATE="/etc/apache2/sites-available/sieve.conf.template"
APACHE_SITE="/etc/apache2/sites-available/sieve.conf"
APACHE_HTTP_TEMPLATE="/etc/apache2/sites-available/000-default.conf.template"
APACHE_HTTP_SITE="/etc/apache2/sites-available/000-default.conf"

DEFAULT_CERT_FILE="/etc/apache2/certs/tls.crt"
DEFAULT_KEY_FILE="/etc/apache2/certs/tls.key"
DEFAULT_SERVER_NAME="sieve.local"

detect_cert_server_name() {
  cert="$1"
  san=""
  cn=""

  if [ ! -f "$cert" ]; then
    return 0
  fi

  san=$(openssl x509 -in "$cert" -noout -ext subjectAltName 2>/dev/null \
    | tr ',' '\n' \
    | sed -n 's/^[[:space:]]*DNS:\([^[:space:]]*\).*/\1/p' \
    | head -1)

  if [ -n "$san" ]; then
    printf '%s' "$san"
    return 0
  fi

  cn=$(openssl x509 -in "$cert" -noout -subject 2>/dev/null \
    | sed -n 's/.*CN[[:space:]]*=[[:space:]]*\([^,/]*\).*/\1/p')

  printf '%s' "$cn"
}

render_apache_site() {
  template="$1"
  output="$2"

  sed \
    -e "s|__SSL_CERTIFICATE_FILE__|${SSL_CERTIFICATE_FILE}|g" \
    -e "s|__SSL_CERTIFICATE_KEY_FILE__|${SSL_CERTIFICATE_KEY_FILE}|g" \
    -e "s|__SERVER_NAME__|${SERVER_NAME}|g" \
    "$template" > "$output"
}

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

SERVER_NAME="${SERVER_NAME:-DEFAULT_SERVER_NAME}"
if [ -z "$SERVER_NAME" ] && [ "$using_defaults" = false ]; then
  SERVER_NAME=$(detect_cert_server_name "$SSL_CERTIFICATE_FILE")
fi
SERVER_NAME="${SERVER_NAME:-$DEFAULT_SERVER_NAME}"
echo "Using ServerName: $SERVER_NAME"

render_apache_site "$APACHE_TEMPLATE" "$APACHE_SITE"
render_apache_site "$APACHE_HTTP_TEMPLATE" "$APACHE_HTTP_SITE"
printf 'ServerName %s\n' "$SERVER_NAME" > /etc/apache2/conf-available/servername.conf
a2enconf servername 2>/dev/null || true

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
