# OMDALA Infra — Makefile
# Common commands for local development and operations.

.PHONY: help up down restart logs ps health backup restore-test migrate seed clean

COMPOSE_FILES := -f docker-compose.yml -f docker-compose.staging.yml

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start all services (production profile)
	docker compose up -d

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

logs: ## Tail logs from all services
	docker compose logs -f

ps: ## List running containers
	docker compose ps

health: ## Run health check script
	@./scripts/health-check.sh

backup: ## Trigger manual backup
	@./scripts/backup-now.sh

restore-test: ## Run restore test (mandatory gate)
	@./scripts/restore-test.sh

migrate: ## Run database migrations
	@echo "Running migrations..."
	@docker compose exec postgres psql -U $$POSTGRES_USER -d $$POSTGRES_DB -f /docker-entrypoint-initdb.d/01-create-users.sql
	@docker compose exec postgres psql -U $$POSTGRES_USER -d $$POSTGRES_DB -f /docker-entrypoint-initdb.d/02-create-schemas.sql

seed: ## Seed local development data
	@echo "Seeding development data..."
	@docker compose exec postgres psql -U $$POSTGRES_APP_USER -d $$POSTGRES_DB -f /tmp/seed.sql

staging-up: ## Start staging environment
	cp .env.staging .env
	docker compose $(COMPOSE_FILES) up -d --build

staging-down: ## Stop staging environment
	docker compose $(COMPOSE_FILES) down

clean: ## Remove all containers, volumes, and images
	docker compose down -v --rmi all
	@echo "Cleanup complete. Run 'make up' to recreate."
