# Fix Fly.io Deployment - Create App and Deploy
# This script fixes the "Could not find App" error

Write-Host "🔧 Fixing Fly.io Deployment Issue" -ForegroundColor Blue
Write-Host "=================================" -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if flyctl is available
try {
    $null = Get-Command flyctl -ErrorAction Stop
    Write-Success "flyctl is available"
}
catch {
    Write-Error "flyctl is not installed. Please install it first:"
    Write-Host "  iwr https://fly.io/install.ps1 -useb | iex" -ForegroundColor White
    exit 1
}

# Check if logged in
try {
    $null = flyctl auth whoami 2>$null
    Write-Success "Authenticated with Fly.io"
}
catch {
    Write-Error "Not logged in to Fly.io. Please run: flyctl auth login"
    exit 1
}

Write-Host ""
Write-Status "The error occurred because the Fly.io app doesn't exist yet."
Write-Status "Let's create the app first, then deploy."
Write-Host ""

# Step 1: Create the app
Write-Status "Step 1: Creating Fly.io app..."
Write-Host ""
Write-Host "Please follow these prompts:" -ForegroundColor Yellow
Write-Host "- App name: ai-code-assistant (or your preferred name)" -ForegroundColor Gray
Write-Host "- Region: Choose closest to your users (e.g. iad for US East)" -ForegroundColor Gray
Write-Host "- PostgreSQL database: Yes" -ForegroundColor Gray
Write-Host "- Redis: No" -ForegroundColor Gray
Write-Host ""

try {
    flyctl launch --no-deploy
    Write-Success "App created successfully!"
}
catch {
    Write-Error "Failed to create app. Please check the error above."
    exit 1
}

Write-Host ""
Write-Status "Step 2: Setting up environment variables..."

# Generate secret key
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$secretKey = [Convert]::ToBase64String($bytes)
flyctl secrets set "SECRET_KEY=$secretKey" --stage
flyctl secrets set "FLASK_ENV=production" --stage
flyctl secrets set "NODE_ENV=production" --stage

Write-Success "Basic environment variables set"
Write-Host ""
Write-Host "⚠️  IMPORTANT: You need to set your AI provider API keys!" -ForegroundColor Yellow
Write-Host "Run these commands with your actual API keys:" -ForegroundColor White
Write-Host ""
Write-Host "flyctl secrets set OPENAI_API_KEY=sk-your-actual-openai-key" -ForegroundColor Gray
Write-Host "flyctl secrets set ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key" -ForegroundColor Gray
Write-Host "flyctl secrets set GITHUB_TOKEN=ghp-your-actual-github-token" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Have you set your API keys? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "Please set your API keys first, then run the deployment again." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Status "Step 3: Deploying application..."

try {
    flyctl deploy --dockerfile Dockerfile.flyio
    Write-Success "Deployment completed successfully!"
}
catch {
    Write-Error "Deployment failed. Check the error above."
    exit 1
}

Write-Host ""
Write-Status "Step 4: Verifying deployment..."

Start-Sleep -Seconds 10

try {
    $appInfo = flyctl info --json | ConvertFrom-Json
    $appUrl = $appInfo.Hostname
    
    if ($appUrl) {
        Write-Success "Application is running at: https://$appUrl"
        
        # Test health endpoint
        try {
            $response = Invoke-WebRequest -Uri "https://$appUrl/api/llm/providers" -UseBasicParsing -TimeoutSec 30
            if ($response.StatusCode -eq 200) {
                Write-Success "Health check passed! ✅"
            }
        }
        catch {
            Write-Host "Health check pending... App may still be starting up." -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "Could not verify deployment automatically. Check manually with: flyctl status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Deployment Fix Complete!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor White
Write-Host "  flyctl status    - Check app status" -ForegroundColor Gray
Write-Host "  flyctl logs      - View application logs" -ForegroundColor Gray
Write-Host "  flyctl open      - Open app in browser" -ForegroundColor Gray
Write-Host ""
Write-Host "Your AI Code Assistant should now be live on Fly.io!" -ForegroundColor Green
