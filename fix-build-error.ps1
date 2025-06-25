# Fix Fly.io Build Error - Vite Not Found
# This script fixes the "vite: not found" build error

Write-Host "Fixing Fly.io Build Error" -ForegroundColor Blue
Write-Host "=========================" -ForegroundColor Blue

Write-Host ""
Write-Host "The build error occurred because Vite (dev dependency) was not installed." -ForegroundColor Yellow
Write-Host "This has been fixed in the Dockerfile." -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "Dockerfile.flyio")) {
    Write-Host "ERROR: Dockerfile.flyio not found. Make sure you're in the project root directory." -ForegroundColor Red
    exit 1
}

# Check if flyctl is available
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: flyctl is not installed." -ForegroundColor Red
    Write-Host "Install it with: iwr https://fly.io/install.ps1 -useb | iex" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Verifying Dockerfile fix..." -ForegroundColor Cyan

# Check if the Dockerfile has been fixed
$dockerfileContent = Get-Content "Dockerfile.flyio" -Raw
if ($dockerfileContent -match "npm ci --only=production") {
    Write-Host "WARNING: Dockerfile still has the old npm ci command." -ForegroundColor Yellow
    Write-Host "Updating Dockerfile to fix the build issue..." -ForegroundColor Cyan
    
    # Fix the Dockerfile
    $dockerfileContent = $dockerfileContent -replace "npm ci --only=production", "npm ci"
    Set-Content "Dockerfile.flyio" $dockerfileContent
    
    Write-Host "SUCCESS: Dockerfile updated!" -ForegroundColor Green
} else {
    Write-Host "SUCCESS: Dockerfile is already fixed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Testing frontend build locally (optional)..." -ForegroundColor Cyan
$testBuild = Read-Host "Do you want to test the frontend build locally first? (y/n)"

if ($testBuild -eq "y" -or $testBuild -eq "Y") {
    Write-Host "Testing frontend build..." -ForegroundColor Cyan
    
    Push-Location "frontend"
    
    # Install dependencies
    Write-Host "Installing frontend dependencies..." -ForegroundColor Gray
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        # Test build
        Write-Host "Testing build process..." -ForegroundColor Gray
        npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: Frontend build test passed!" -ForegroundColor Green
        } else {
            Write-Host "ERROR: Frontend build test failed." -ForegroundColor Red
            Pop-Location
            exit 1
        }
    } else {
        Write-Host "ERROR: Failed to install frontend dependencies." -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
}

Write-Host ""
Write-Host "Step 3: Deploying with fixed Dockerfile..." -ForegroundColor Cyan

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

# Deploy with the fixed Dockerfile
Write-Host "Deploying application..." -ForegroundColor Cyan
flyctl deploy --dockerfile Dockerfile.flyio

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Deployment completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The build error has been fixed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor White
    Write-Host "  flyctl status    - Check app status" -ForegroundColor Gray
    Write-Host "  flyctl logs      - View application logs" -ForegroundColor Gray
    Write-Host "  flyctl open      - Open app in browser" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Your AI Code Assistant should now be live on Fly.io!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERROR: Deployment failed." -ForegroundColor Red
    Write-Host "Check the error above for details." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor White
    Write-Host "1. Check if all secrets are set: flyctl secrets list" -ForegroundColor Gray
    Write-Host "2. View build logs: flyctl logs" -ForegroundColor Gray
    Write-Host "3. Retry deployment: flyctl deploy --dockerfile Dockerfile.flyio" -ForegroundColor Gray
}
