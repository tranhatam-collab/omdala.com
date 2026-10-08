# Local Development Guide

> **Scope:** Getting started with OMDALA infra on your local machine  
> **Prerequisites:** Docker, Docker Compose, Make (optional)

---

## Quick Start

```bash
cd omdala.com/infra

# 1. Copy environment template
cp .env.example .env
# Edit .env with your local values (dev passwords are fine locally)

# 2. Start all services (dev profile with hot-reload)
docker compose up -d

# 3. Verify health
make health
# or
./scripts/health-check.sh

# 4. Open services
# API Gateway: http://localhost:3000/health
# PostgreSQL:  localhost:5432 (user: postgres, password: dev_password)
# Valkey:      localhost:6379
# MailHog:     http://localhost:8025 (catch emails locally)
```

---

## Directory Layout

```
infra/
├── docker-compose.yml          # Production services
├── docker-compose.override.yml # Local dev: hot-reload, debug ports, mailhog
├── docker-compose.staging.yml  # Staging overrides
├── .env.example                # Template for all env vars
├── .env.staging.example        # Staging-specific template
├── Makefile                    # Common commands
│
├── services/
│   ├── api-gateway/            # Fastify API (port 3000)
│   └── worker/                 # BullMQ processor (port 3001)
│
├── postgres/
│   └── init-scripts/
│       ├── 01-create-users.sql # Roles and extensions
│       ├── 02-create-schemas.sql # Full schema
│       └── 03-seed-data.sql    # Dev seed data
│
├── scripts/
│   ├── bootstrap.sh            # Server setup
│   ├── health-check.sh         # Stack verification
│   ├── backup-now.sh           # Manual backup
│   ├── restore-test.sh         # Restore verification
│   └── migrate.sh              # Database migration runner
│
└── docs/
    ├── ARCHITECTURE.md
    ├── SECURITY.md
    ├── BACKUP_RESTORE.md
    ├── INCIDENT_RUNBOOK.md
    └── API_REFERENCE.md
```

---

## Hot Reload

The `docker-compose.override.yml` mounts source directories as read-only volumes:

| Service | Local Path | Container Path |
|---------|-----------|----------------|
| API Gateway | `services/api-gateway/src/` | `/app/src/` |
| Worker | `services/worker/src/` | `/app/src/` |

Changes are picked up immediately (Node.js `--watch`).

---

## Debug Ports

| Service | Port | Purpose |
|---------|------|---------|
| API Gateway | `9229` | Node.js inspector |
| Worker | `9230` | Node.js inspector |
| PostgreSQL | `5432` | Direct DB access |
| Valkey | `6379` | Redis CLI access |

Connect with VS Code or Chrome DevTools.

---

## Database Migrations

```bash
# Run schema migrations
make migrate

# Or manually
./scripts/migrate.sh

# With seed data
./scripts/migrate.sh --seed
```

**Note:** Init scripts in `postgres/init-scripts/` run automatically on first container start. Use `migrate.sh` for re-running or applying updates.

---

## Running Tests

```bash
# API Gateway
cd services/api-gateway
npm test

# Worker
cd services/worker
npm test
```

---

## Troubleshooting

### PostgreSQL port already in use
```bash
# Find and kill process using port 5432
lsof -ti:5432 | xargs kill -9
```

### Container won't start
```bash
# View logs
docker compose logs <service-name>

# Restart single service
docker compose restart <service-name>
```

### Reset everything
```bash
make clean    # Removes containers, volumes, images
make up       # Recreate fresh
```

---

## Mail Testing

Local development includes MailHog at `http://localhost:8025`. All emails sent by the worker are captured here — no real emails are sent in dev mode.

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-05
