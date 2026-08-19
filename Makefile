# Convenience targets wrapping the same commands CI runs.
# Every target works from a fresh clone.

.PHONY: help install dev test test-backend test-frontend coverage lint typecheck \
        format build verify audit docker-up docker-down clean

help: ## Show the available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Install backend and frontend dependencies from lockfiles
	python -m pip install -r backend/requirements-dev.txt
	npm ci

dev: ## Run the frontend dev server (start the backend separately)
	npm run dev

test: test-backend test-frontend ## Run both test suites

test-backend: ## Run the Django test suite
	cd backend && python -m pytest

test-frontend: ## Run the vitest suite
	npm run test --workspace frontend

coverage: ## Run both suites with coverage thresholds enforced
	cd backend && python -m pytest --cov --cov-fail-under=85
	npm run test:coverage --workspace frontend

lint: ## Lint both stacks
	cd backend && python -m ruff check .
	npm run lint --workspace frontend

typecheck: ## Type check the frontend
	npm run typecheck --workspace frontend

format: ## Apply formatters to both stacks
	cd backend && python -m ruff format .
	npm run format --workspace frontend

build: ## Produce a production frontend bundle
	npm run build --workspace frontend

verify: lint typecheck test build ## Run everything CI runs

audit: ## Check dependencies for known vulnerabilities
	npm audit --audit-level=high
	cd backend && python -m pip_audit -r requirements.lock.txt

docker-up: ## Bring up the full stack (Postgres plus the app)
	docker compose up --build

docker-down: ## Tear the stack down and drop its volumes
	docker compose down -v

clean: ## Remove build and test artifacts
	rm -rf frontend/dist frontend/coverage backend/htmlcov backend/.coverage
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
