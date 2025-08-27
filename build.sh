#!/usr/bin/env bash
# build.sh - Build script for Render deployment

# Exit on any error
set -o errexit

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Build client and server separately (avoid circular dependency)
npm run build:client
npm run build:server

# Push database schema (only if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
  npm run db:push
fi