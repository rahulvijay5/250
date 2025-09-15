#!/bin/sh
set -e

# Wait for DATABASE_URL to be present
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

# Run Prisma migrations (safe for prod if migrations exist)
# Fall back to db push if migrate fails (first-time deploy)
if npx prisma migrate deploy; then
  echo "Migrations applied"
else
  echo "Migrate deploy failed, trying prisma db push"
  npx prisma db push || true
fi

exec "$@"

