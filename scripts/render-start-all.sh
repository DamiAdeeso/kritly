#!/usr/bin/env sh
# Single Render free web instance: all microservices on localhost gRPC ports.
set -e

export AUTH_SERVICE_HOST="${AUTH_SERVICE_HOST:-127.0.0.1}"
export AUTH_SERVICE_PORT="${AUTH_SERVICE_PORT:-3001}"
export UPLOAD_SERVICE_HOST="${UPLOAD_SERVICE_HOST:-127.0.0.1}"
export UPLOAD_SERVICE_PORT="${UPLOAD_SERVICE_PORT:-3002}"
export NOTIFICATION_SERVICE_HOST="${NOTIFICATION_SERVICE_HOST:-127.0.0.1}"
export NOTIFICATION_SERVICE_GRPC_PORT="${NOTIFICATION_SERVICE_GRPC_PORT:-3003}"

node apps/auth-service/dist/main.js &
node apps/upload-service/dist/main.js &
node apps/notification-service/dist/main.js &

exec node apps/gateway/dist/main.js
