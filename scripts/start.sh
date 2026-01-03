#!/bin/sh
set -e

echo "Running database migrations..."
bun /app/migrate.js

echo "Starting server..."
exec bun server.js
