# Rev Microservices Makefile

.PHONY: help install build dev prod clean logs test

# Default target
help:
	@echo "Rev Microservices - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install all dependencies"
	@echo "  make dev        - Start development environment"
	@echo "  make dev-down   - Stop development environment"
	@echo "  make logs       - View logs"
	@echo ""
	@echo "Production:"
	@echo "  make prod       - Start production environment"
	@echo "  make prod-down  - Stop production environment"
	@echo ""
	@echo "Building:"
	@echo "  make build      - Build all services"
	@echo "  make build-auth - Build auth service only"
	@echo "  make build-gateway - Build gateway service only"
	@echo ""
	@echo "Database:"
	@echo "  make db-generate - Generate Prisma client"
	@echo "  make db-migrate  - Run database migrations"
	@echo "  make db-studio   - Open Prisma Studio"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make test       - Run tests"

# Install dependencies
install:
	npm install

# Development environment
dev:
	docker-compose -f docker-compose.dev.yml up --build

dev-down:
	docker-compose -f docker-compose.dev.yml down

# Production environment
prod:
	docker-compose up --build

prod-down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Build all services
build:
	docker build -f apps/auth-service/Dockerfile -t rev-auth-service .
	docker build -f apps/gateway/Dockerfile -t rev-gateway .

# Build individual services
build-auth:
	docker build -f apps/auth-service/Dockerfile -t rev-auth-service .

build-gateway:
	docker build -f apps/gateway/Dockerfile -t rev-gateway .

# Nx build commands
nx-build-auth:
	npx nx build auth-service

nx-build-gateway:
	npx nx build gateway

nx-build-common:
	npx nx build common

nx-build-all:
	npx nx run-many --target=build --projects=auth-service,gateway,common

# Database commands
db-generate:
	npx nx run auth-service:prisma:generate

db-migrate:
	npx nx run auth-service:prisma:migrate

db-studio:
	npx nx run auth-service:prisma:studio

db-seed:
	npx nx run auth-service:prisma:seed

# Clean build artifacts
clean:
	npx nx reset
	rm -rf node_modules
	docker system prune -f

# Run tests
test:
	npx nx run-many --target=test --all

# Deployment commands
deploy:
	./deploy.sh

deploy-auth:
	flyctl deploy --config fly.toml --app rev-auth-service

deploy-gateway:
	flyctl deploy --config apps/gateway/fly.toml --app rev-gateway

deploy-secrets:
	flyctl secrets import env.deployment --app rev-auth-service
	flyctl secrets import env.deployment --app rev-gateway

fly-status:
	flyctl status --app rev-auth-service
	flyctl status --app rev-gateway

fly-logs:
	flyctl logs --app rev-auth-service
	flyctl logs --app rev-gateway

