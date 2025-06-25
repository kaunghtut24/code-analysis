# Fix Fly.io Database Initialization Error
# This script fixes the SQLAlchemy table_names() error

Write-Host "Fixing Fly.io Database Initialization Error" -ForegroundColor Blue
Write-Host "===========================================" -ForegroundColor Blue

Write-Host ""
Write-Host "The deployment failed during database initialization." -ForegroundColor Yellow
Write-Host "This has been fixed in the init_db.py script." -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend/src/init_db.py")) {
    Write-Host "ERROR: init_db.py not found. Make sure you're in the project root directory." -ForegroundColor Red
    exit 1
}

# Check if flyctl is available
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: flyctl is not installed." -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Verifying database initialization script fix..." -ForegroundColor Cyan

# Check if the script has been fixed
$initDbContent = Get-Content "backend/src/init_db.py" -Raw
if ($initDbContent -match "db\.engine\.table_names\(\)") {
    Write-Host "WARNING: init_db.py still has the old table_names() method." -ForegroundColor Yellow
    Write-Host "Updating init_db.py to fix the SQLAlchemy issue..." -ForegroundColor Cyan
    
    # Fix the script
    $initDbContent = $initDbContent -replace "tables = db\.engine\.table_names\(\)", "from sqlalchemy import inspect`n            inspector = inspect(db.engine)`n            tables = inspector.get_table_names()"
    Set-Content "backend/src/init_db.py" $initDbContent
    
    Write-Host "SUCCESS: init_db.py updated!" -ForegroundColor Green
} else {
    Write-Host "SUCCESS: init_db.py is already fixed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Checking database configuration..." -ForegroundColor Cyan

# Check if DATABASE_URL is set
try {
    $secrets = flyctl secrets list 2>$null
    if ($secrets -match "DATABASE_URL") {
        Write-Host "SUCCESS: DATABASE_URL is configured" -ForegroundColor Green
    } else {
        Write-Host "WARNING: DATABASE_URL not found in secrets" -ForegroundColor Yellow
        Write-Host "This might mean PostgreSQL database is not attached." -ForegroundColor Yellow
        
        $attachDb = Read-Host "Do you want to create and attach a PostgreSQL database? (y/n)"
        if ($attachDb -eq "y" -or $attachDb -eq "Y") {
            Write-Host "Creating PostgreSQL database..." -ForegroundColor Cyan
            flyctl postgres create --name ai-code-assistant-db --region iad
            
            Write-Host "Attaching database to app..." -ForegroundColor Cyan
            flyctl postgres attach --app ai-code-assistant ai-code-assistant-db
            
            Write-Host "SUCCESS: Database created and attached!" -ForegroundColor Green
        }
    }
}
catch {
    Write-Host "Could not check secrets. Continuing with deployment..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Deploying with fixed database initialization..." -ForegroundColor Cyan

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

# Deploy with the fixed initialization script
Write-Host "Deploying application..." -ForegroundColor Cyan
flyctl deploy --dockerfile Dockerfile.flyio

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Deployment completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The database initialization error has been fixed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor White
    Write-Host "  flyctl status    - Check app status" -ForegroundColor Gray
    Write-Host "  flyctl logs      - View application logs" -ForegroundColor Gray
    Write-Host "  flyctl open      - Open app in browser" -ForegroundColor Gray
    Write-Host "  flyctl ssh console - SSH into the machine" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Your AI Code Assistant should now be live on Fly.io!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERROR: Deployment failed." -ForegroundColor Red
    Write-Host "Check the error above for details." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor White
    Write-Host "1. Check deployment logs: flyctl logs" -ForegroundColor Gray
    Write-Host "2. Check database status: flyctl postgres list" -ForegroundColor Gray
    Write-Host "3. Verify secrets are set: flyctl secrets list" -ForegroundColor Gray
    Write-Host "4. Retry deployment: flyctl deploy --dockerfile Dockerfile.flyio" -ForegroundColor Gray
}
