#!/usr/bin/env sh
# Single Render free web instance: all microservices on localhost gRPC ports.
set -e

export AUTH_SERVICE_HOST="${AUTH_SERVICE_HOST:-127.0.0.1}"
export AUTH_SERVICE_PORT="${AUTH_SERVICE_PORT:-3001}"
export UPLOAD_SERVICE_HOST="${UPLOAD_SERVICE_HOST:-127.0.0.1}"
export UPLOAD_SERVICE_PORT="${UPLOAD_SERVICE_PORT:-3002}"
export NOTIFICATION_SERVICE_HOST="${NOTIFICATION_SERVICE_HOST:-127.0.0.1}"
export NOTIFICATION_SERVICE_GRPC_PORT="${NOTIFICATION_SERVICE_GRPC_PORT:-3003}"

COMMON_ENTRY="libs/common/dist/src/index.js"
if [ ! -f "$COMMON_ENTRY" ]; then
  echo "error: missing $COMMON_ENTRY — run nx build for gateway (or common) before start" >&2
  exit 1
fi

for app in auth-service upload-service notification-service gateway; do
  entry="apps/$app/dist/src/main.js"
  if [ ! -f "$entry" ]; then
    echo "error: missing $entry" >&2
    exit 1
  fi
done

node apps/auth-service/dist/src/main.js &
node apps/upload-service/dist/src/main.js &
node apps/notification-service/dist/src/main.js &

# Let gRPC backends bind before the HTTP gateway accepts traffic.
sleep 3

exec node apps/gateway/dist/src/main.js
