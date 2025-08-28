#!/bin/bash

# Rev Microservices Fly.io Deployment Script
# Multi-App Deployment: rev-auth-service and rev-gateway

set -e

echo "🚀 Starting Rev Microservices Fly.io Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    print_error "flyctl is not installed. Please install it first:"
    echo "winget install Fly.Flyctl"
    exit 1
fi

# Check if user is logged in
if ! flyctl auth whoami &> /dev/null; then
    print_error "Not logged in to Fly.io. Please run: flyctl auth login"
    exit 1
fi

print_status "Deploying Auth Service (rev-auth-service)..."

# Deploy Auth Service
cd "$(dirname "$0")"
flyctl deploy --config fly.toml --app rev-auth-service

if [ $? -eq 0 ]; then
    print_status "✅ Auth Service deployed successfully!"
else
    print_error "❌ Auth Service deployment failed!"
    exit 1
fi

print_status "Deploying Gateway Service (rev-gateway)..."

# Deploy Gateway Service
flyctl deploy --config apps/gateway/fly.toml --app rev-gateway

if [ $? -eq 0 ]; then
    print_status "✅ Gateway Service deployed successfully!"
else
    print_error "❌ Gateway Service deployment failed!"
    exit 1
fi

print_status "Setting up secrets for Auth Service..."

# Set secrets for Auth Service
flyctl secrets import env.deployment --app rev-auth-service

print_status "Setting up secrets for Gateway Service..."

# Set secrets for Gateway Service
flyctl secrets import env.deployment --app rev-gateway

print_status "🎉 Deployment completed successfully!"

echo ""
echo "📋 Deployment Summary:"
echo "  🔐 Auth Service: https://rev-auth-service.fly.dev"
echo "  🌐 Gateway Service: https://rev-gateway.fly.dev"
echo "  📚 API Documentation: https://rev-gateway.fly.dev/api/docs"
echo ""
echo "🔍 To check deployment status:"
echo "  flyctl status --app rev-auth-service"
echo "  flyctl status --app rev-gateway"
echo ""
echo "📊 To view logs:"
echo "  flyctl logs --app rev-auth-service"
echo "  flyctl logs --app rev-gateway"
