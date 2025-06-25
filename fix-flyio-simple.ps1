# Simple Fly.io Deployment Fix
# This script fixes the "Could not find App" error

Write-Host "Fixing Fly.io Deployment Issue" -ForegroundColor Blue
Write-Host "===============================" -ForegroundColor Blue

# Check if flyctl is available
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: flyctl is not installed." -ForegroundColor Red
    Write-Host "Install it with: iwr https://fly.io/install.ps1 -useb | iex" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    flyctl auth whoami | Out-Null
    Write-Host "SUCCESS: Authenticated with Fly.io" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Not logged in to Fly.io." -ForegroundColor Red
    Write-Host "Please run: flyctl auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "The error occurred because the Fly.io app doesn't exist yet." -ForegroundColor Yellow
Write-Host "Let's create the app first, then deploy." -ForegroundColor Yellow
Write-Host ""

# Step 1: Create the app
Write-Host "Step 1: Creating Fly.io app..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Please follow these prompts:" -ForegroundColor Yellow
Write-Host "- App name: ai-code-assistant (or your preferred name)" -ForegroundColor Gray
Write-Host "- Region: Choose closest to your users" -ForegroundColor Gray
Write-Host "- PostgreSQL database: Yes" -ForegroundColor Gray
Write-Host "- Redis: No" -ForegroundColor Gray
Write-Host ""

flyctl launch --no-deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create app." -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: App created!" -ForegroundColor Green
Write-Host ""

# Step 2: Set environment variables
Write-Host "Step 2: Setting up environment variables..." -ForegroundColor Cyan

# Generate secret key using a simple method
$secretKey = -join ((1..32) | ForEach {[char]((65..90) + (97..122) + (48..57) | Get-Random)})

flyctl secrets set "SECRET_KEY=$secretKey" --stage
flyctl secrets set "FLASK_ENV=production" --stage
flyctl secrets set "NODE_ENV=production" --stage

Write-Host "SUCCESS: Basic environment variables set" -ForegroundColor Green
Write-Host ""

# Step 3: API Keys
Write-Host "IMPORTANT: You need to set your AI provider API keys!" -ForegroundColor Yellow
Write-Host "Run these commands with your actual API keys:" -ForegroundColor White
Write-Host ""
Write-Host "flyctl secrets set OPENAI_API_KEY=sk-your-actual-openai-key" -ForegroundColor Gray
Write-Host "flyctl secrets set ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Have you set your API keys? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "Please set your API keys first, then run deployment again." -ForegroundColor Yellow
    Write-Host "After setting keys, run: flyctl deploy --dockerfile Dockerfile.flyio" -ForegroundColor Cyan
    exit 0
}

# Step 4: Deploy
Write-Host ""
Write-Host "Step 3: Deploying application..." -ForegroundColor Cyan

flyctl deploy --dockerfile Dockerfile.flyio

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Deployment completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor White
    Write-Host "  flyctl status    - Check app status" -ForegroundColor Gray
    Write-Host "  flyctl logs      - View application logs" -ForegroundColor Gray
    Write-Host "  flyctl open      - Open app in browser" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Your AI Code Assistant should now be live on Fly.io!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Deployment failed. Check the error above." -ForegroundColor Red
    Write-Host "You can retry with: flyctl deploy --dockerfile Dockerfile.flyio" -ForegroundColor Yellow
}
