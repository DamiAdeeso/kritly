# Rev Microservices Fly.io Deployment Script (PowerShell)
# Multi-App Deployment: rev-auth-service and rev-gateway

param(
    [switch]$SkipAuth,
    [switch]$SkipGateway,
    [switch]$SkipSecrets
)

Write-Host "🚀 Starting Rev Microservices Fly.io Deployment..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if flyctl is installed
try {
    $null = Get-Command flyctl -ErrorAction Stop
} catch {
    Write-Error "flyctl is not installed. Please install it first:"
    Write-Host "winget install Fly.Flyctl" -ForegroundColor Cyan
    exit 1
}

# Check if user is logged in
try {
    $null = flyctl auth whoami 2>$null
} catch {
    Write-Error "Not logged in to Fly.io. Please run: flyctl auth login"
    exit 1
}

# Deploy Auth Service
if (-not $SkipAuth) {
    Write-Status "Deploying Auth Service (rev-auth-service)..."
    
    try {
        flyctl deploy --config fly.toml --app rev-auth-service
        if ($LASTEXITCODE -eq 0) {
            Write-Status "✅ Auth Service deployed successfully!"
        } else {
            Write-Error "❌ Auth Service deployment failed!"
            exit 1
        }
    } catch {
        Write-Error "❌ Auth Service deployment failed!"
        exit 1
    }
}

# Deploy Gateway Service
if (-not $SkipGateway) {
    Write-Status "Deploying Gateway Service (rev-gateway)..."
    
    try {
        flyctl deploy --config apps/gateway/fly.toml --app rev-gateway
        if ($LASTEXITCODE -eq 0) {
            Write-Status "✅ Gateway Service deployed successfully!"
        } else {
            Write-Error "❌ Gateway Service deployment failed!"
            exit 1
        }
    } catch {
        Write-Error "❌ Gateway Service deployment failed!"
        exit 1
    }
}

# Set up secrets
if (-not $SkipSecrets) {
    Write-Status "Setting up secrets for Auth Service..."
    # Import secrets from env.deployment file
    Get-Content env.deployment | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2]
            flyctl secrets set "$key=$value" --app rev-auth-service
        }
    }
    
    Write-Status "Setting up secrets for Gateway Service..."
    # Import secrets from env.deployment file
    Get-Content env.deployment | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1]
            $value = $matches[2]
            flyctl secrets set "$key=$value" --app rev-gateway
        }
    }
}

Write-Status "🎉 Deployment completed successfully!"

Write-Host ""
Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "  🔐 Auth Service: https://rev-auth-service.fly.dev" -ForegroundColor White
Write-Host "  🌐 Gateway Service: https://rev-gateway.fly.dev" -ForegroundColor White
Write-Host "  📚 API Documentation: https://rev-gateway.fly.dev/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "🔍 To check deployment status:" -ForegroundColor Cyan
Write-Host "  flyctl status --app rev-auth-service" -ForegroundColor White
Write-Host "  flyctl status --app rev-gateway" -ForegroundColor White
Write-Host ""
Write-Host "📊 To view logs:" -ForegroundColor Cyan
Write-Host "  flyctl logs --app rev-auth-service" -ForegroundColor White
Write-Host "  flyctl logs --app rev-gateway" -ForegroundColor White
