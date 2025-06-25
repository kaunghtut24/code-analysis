# Fly.io Deployment Script for AI Code Assistant (PowerShell)
# This script automates the deployment process to Fly.io

param(
    [string]$Action = "deploy"
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 AI Code Assistant - Fly.io Deployment Script" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
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
function Test-Flyctl {
    try {
        $null = Get-Command flyctl -ErrorAction Stop
        Write-Success "flyctl is installed"
        return $true
    }
    catch {
        Write-Error "flyctl is not installed. Please install it first:"
        Write-Host "  Windows: iwr https://fly.io/install.ps1 -useb | iex" -ForegroundColor White
        return $false
    }
}

# Check if user is logged in
function Test-Auth {
    try {
        $null = flyctl auth whoami 2>$null
        Write-Success "Authenticated with Fly.io"
        return $true
    }
    catch {
        Write-Error "Not logged in to Fly.io. Please run: flyctl auth login"
        return $false
    }
}

# Generate secret key
function New-SecretKey {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Set environment variables
function Set-Secrets {
    Write-Status "Setting up environment variables..."
    
    # Generate and set secret key
    $secretKey = New-SecretKey
    flyctl secrets set "SECRET_KEY=$secretKey" --stage
    
    # Set environment
    flyctl secrets set "FLASK_ENV=production" --stage
    flyctl secrets set "NODE_ENV=production" --stage
    
    Write-Success "Basic environment variables set"
    
    # Prompt for API keys
    Write-Host ""
    Write-Warning "Please set your AI provider API keys:"
    Write-Host "Example commands:" -ForegroundColor White
    Write-Host "  flyctl secrets set OPENAI_API_KEY=sk-your-key" -ForegroundColor Gray
    Write-Host "  flyctl secrets set ANTHROPIC_API_KEY=sk-ant-your-key" -ForegroundColor Gray
    Write-Host "  flyctl secrets set GITHUB_TOKEN=ghp-your-token" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter after setting your API keys"
}

# Create and attach database
function Set-Database {
    Write-Status "Setting up PostgreSQL database..."
    
    $dbName = "ai-code-assistant-db"
    
    try {
        $appInfo = flyctl info --json | ConvertFrom-Json
        $appName = $appInfo.Name
    }
    catch {
        $appName = "ai-code-assistant"
    }
    
    # Check if database already exists
    $dbList = flyctl postgres list
    if ($dbList -match $dbName) {
        Write-Warning "Database $dbName already exists"
    }
    else {
        Write-Status "Creating PostgreSQL database..."
        flyctl postgres create --name $dbName --region iad
    }
    
    # Attach database
    Write-Status "Attaching database to app..."
    try {
        flyctl postgres attach --app $appName $dbName
    }
    catch {
        Write-Warning "Database might already be attached"
    }
    
    Write-Success "Database setup complete"
}

# Deploy application
function Deploy-App {
    Write-Status "Deploying application to Fly.io..."
    
    # Build and deploy
    flyctl deploy --dockerfile Dockerfile.flyio
    
    Write-Success "Deployment complete!"
}

# Verify deployment
function Test-Deployment {
    Write-Status "Verifying deployment..."
    
    try {
        $appInfo = flyctl info --json | ConvertFrom-Json
        $appUrl = $appInfo.Hostname
        
        if ($appUrl) {
            Write-Status "Testing health endpoint..."
            
            # Wait a moment for app to start
            Start-Sleep -Seconds 10
            
            try {
                $response = Invoke-WebRequest -Uri "https://$appUrl/api/llm/providers" -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    Write-Success "Health check passed!"
                    Write-Success "Application is running at: https://$appUrl"
                }
                else {
                    Write-Warning "Health check failed. Check logs with: flyctl logs"
                }
            }
            catch {
                Write-Warning "Health check failed. Check logs with: flyctl logs"
            }
        }
        else {
            Write-Warning "Could not determine app URL. Check status with: flyctl status"
        }
    }
    catch {
        Write-Warning "Could not verify deployment. Check status with: flyctl status"
    }
}

# Show post-deployment info
function Show-Info {
    Write-Host ""
    Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
    Write-Host "======================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor White
    Write-Host "  flyctl status          - Check app status" -ForegroundColor Gray
    Write-Host "  flyctl logs           - View application logs" -ForegroundColor Gray
    Write-Host "  flyctl open           - Open app in browser" -ForegroundColor Gray
    Write-Host "  flyctl ssh console    - SSH into the machine" -ForegroundColor Gray
    Write-Host "  flyctl scale count 1  - Scale to 1 machine" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To update your app:" -ForegroundColor White
    Write-Host "  git push origin flyio-deployment" -ForegroundColor Gray
    Write-Host "  flyctl deploy" -ForegroundColor Gray
    Write-Host ""
}

# Main deployment flow
function Start-Deployment {
    Write-Host "Starting deployment process..." -ForegroundColor Blue
    Write-Host ""
    
    # Pre-flight checks
    if (-not (Test-Flyctl)) { exit 1 }
    if (-not (Test-Auth)) { exit 1 }
    
    # Check if app exists
    try {
        $null = flyctl info 2>$null
    }
    catch {
        Write-Status "App not found. Please run 'flyctl launch --no-deploy' first"
        exit 1
    }
    
    # Setup process
    Set-Secrets
    Set-Database
    Deploy-App
    Test-Deployment
    Show-Info
    
    Write-Success "All done! Your AI Code Assistant is live on Fly.io! 🚀"
}

# Handle script arguments
switch ($Action.ToLower()) {
    "secrets" {
        if (-not (Test-Flyctl)) { exit 1 }
        if (-not (Test-Auth)) { exit 1 }
        Set-Secrets
    }
    "database" {
        if (-not (Test-Flyctl)) { exit 1 }
        if (-not (Test-Auth)) { exit 1 }
        Set-Database
    }
    "deploy" {
        if (-not (Test-Flyctl)) { exit 1 }
        if (-not (Test-Auth)) { exit 1 }
        Deploy-App
    }
    "verify" {
        Test-Deployment
    }
    default {
        Start-Deployment
    }
}
