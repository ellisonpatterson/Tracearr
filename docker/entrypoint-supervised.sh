#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[Tracearr]${NC} $1"; }
warn() { echo -e "${YELLOW}[Tracearr]${NC} $1"; }
error() { echo -e "${RED}[Tracearr]${NC} $1"; }

# Create log directory
mkdir -p /var/log/supervisor

# =============================================================================
# Generate secrets if not provided
# =============================================================================
if [ -z "$JWT_SECRET" ]; then
    if [ -f /data/tracearr/.jwt_secret ]; then
        export JWT_SECRET=$(cat /data/tracearr/.jwt_secret)
        log "Loaded JWT_SECRET from persistent storage"
    else
        export JWT_SECRET=$(openssl rand -hex 32)
        mkdir -p /data/tracearr
        echo "$JWT_SECRET" > /data/tracearr/.jwt_secret
        chmod 600 /data/tracearr/.jwt_secret
        log "Generated new JWT_SECRET"
    fi
fi

if [ -z "$COOKIE_SECRET" ]; then
    if [ -f /data/tracearr/.cookie_secret ]; then
        export COOKIE_SECRET=$(cat /data/tracearr/.cookie_secret)
        log "Loaded COOKIE_SECRET from persistent storage"
    else
        export COOKIE_SECRET=$(openssl rand -hex 32)
        mkdir -p /data/tracearr
        echo "$COOKIE_SECRET" > /data/tracearr/.cookie_secret
        chmod 600 /data/tracearr/.cookie_secret
        log "Generated new COOKIE_SECRET"
    fi
fi

if [ -z "$ENCRYPTION_KEY" ]; then
    if [ -f /data/tracearr/.encryption_key ]; then
        export ENCRYPTION_KEY=$(cat /data/tracearr/.encryption_key)
        log "Loaded ENCRYPTION_KEY from persistent storage"
    else
        export ENCRYPTION_KEY=$(openssl rand -hex 32)
        mkdir -p /data/tracearr
        echo "$ENCRYPTION_KEY" > /data/tracearr/.encryption_key
        chmod 600 /data/tracearr/.encryption_key
        log "Generated new ENCRYPTION_KEY"
    fi
fi

# =============================================================================
# Initialize PostgreSQL if needed
# =============================================================================
if [ ! -f /data/postgres/PG_VERSION ]; then
    log "Initializing PostgreSQL database..."

    # Initialize the database cluster
    gosu postgres /usr/lib/postgresql/15/bin/initdb -D /data/postgres

    # Configure PostgreSQL
    echo "shared_preload_libraries = 'timescaledb'" >> /data/postgres/postgresql.conf
    echo "listen_addresses = '127.0.0.1'" >> /data/postgres/postgresql.conf
    echo "port = 5432" >> /data/postgres/postgresql.conf
    echo "log_timezone = 'UTC'" >> /data/postgres/postgresql.conf
    echo "timezone = 'UTC'" >> /data/postgres/postgresql.conf

    # Allow local connections
    echo "local all all trust" > /data/postgres/pg_hba.conf
    echo "host all all 127.0.0.1/32 md5" >> /data/postgres/pg_hba.conf

    # Start PostgreSQL temporarily to create database and user
    gosu postgres /usr/lib/postgresql/15/bin/pg_ctl -D /data/postgres -w start

    log "Creating tracearr database and user..."
    gosu postgres psql -c "CREATE USER tracearr WITH PASSWORD 'tracearr';"
    gosu postgres psql -c "CREATE DATABASE tracearr OWNER tracearr;"
    gosu postgres psql -d tracearr -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"
    gosu postgres psql -d tracearr -c "GRANT ALL PRIVILEGES ON DATABASE tracearr TO tracearr;"
    gosu postgres psql -d tracearr -c "GRANT ALL ON SCHEMA public TO tracearr;"

    # Stop PostgreSQL (supervisord will start it)
    gosu postgres /usr/lib/postgresql/15/bin/pg_ctl -D /data/postgres -w stop

    log "PostgreSQL initialized successfully"
else
    log "PostgreSQL data directory exists, skipping initialization"
fi

# Ensure correct ownership
chown -R postgres:postgres /data/postgres
chown -R redis:redis /data/redis

# =============================================================================
# Link GeoIP database if exists
# =============================================================================
if [ -f /data/tracearr/GeoLite2-City.mmdb ]; then
    mkdir -p /app/data
    ln -sf /data/tracearr/GeoLite2-City.mmdb /app/data/GeoLite2-City.mmdb
    log "GeoIP database linked"
elif [ -f /app/data/GeoLite2-City.mmdb ]; then
    log "GeoIP database found in app directory"
else
    warn "GeoIP database not found - geolocation features will be limited"
    warn "Place GeoLite2-City.mmdb in /data/tracearr/ for full functionality"
fi

# =============================================================================
# Start supervisord
# =============================================================================
log "Starting Tracearr services..."
exec "$@"
