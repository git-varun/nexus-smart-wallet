#!/bin/sh
set -e

# Ensure mounted runtime directories are writable by the non-root node user.
mkdir -p /app/logs /app/uploads/profile-images
chown -R node:node /app/logs /app/uploads

exec su-exec node node dist/index.js
