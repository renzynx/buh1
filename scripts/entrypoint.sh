#!/bin/sh
set -e

chown -R nextjs:nodejs /app/db /app/storage

exec su-exec nextjs /app/start.sh
