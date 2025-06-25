# Automated Fix and Redeploy Script for Fly.io
# This script automatically diagnoses and fixes the API key issue

param(
    [switch]$ForceRedeploy = $false
)

Write-Host "🤖 Automated Fly.io Fix and Redeploy" -ForegroundColor Blue
Write-Host "====================================" -ForegroundColor Blue

# Function to print colored output
function Write-Status { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Check prerequisites
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Error "flyctl is not installed. Please install it first."
    exit 1
}

try {
    flyctl auth whoami | Out-Null
    Write-Success "Authenticated with Fly.io"
}
catch {
    Write-Error "Not logged in to Fly.io. Please run: flyctl auth login"
    exit 1
}

Write-Host ""
Write-Status "Step 1: Diagnosing current application state..."

# Get app info
try {
    $appInfo = flyctl info --json | ConvertFrom-Json
    $appName = $appInfo.Name
    $hostname = $appInfo.Hostname
    Write-Success "App: $appName"
    Write-Success "URL: https://$hostname"
}
catch {
    Write-Error "Could not get app information"
    exit 1
}

# Check secrets
Write-Status "Checking environment variables..."
try {
    $secrets = flyctl secrets list
    $hasOpenAI = $secrets -match "OPENAI_API_KEY"
    $hasSecret = $secrets -match "SECRET_KEY"
    $hasFlask = $secrets -match "FLASK_ENV"
    
    Write-Host "Environment variables status:" -ForegroundColor Gray
    Write-Host "  OPENAI_API_KEY: $(if($hasOpenAI){'✅ SET'}else{'❌ MISSING'})" -ForegroundColor Gray
    Write-Host "  SECRET_KEY: $(if($hasSecret){'✅ SET'}else{'❌ MISSING'})" -ForegroundColor Gray
    Write-Host "  FLASK_ENV: $(if($hasFlask){'✅ SET'}else{'❌ MISSING'})" -ForegroundColor Gray
}
catch {
    Write-Warning "Could not check secrets"
}

# Test current API endpoint
Write-Status "Testing current API endpoint..."
$apiWorking = $false
try {
    $healthResponse = Invoke-WebRequest -Uri "https://$hostname/api/llm/providers" -UseBasicParsing -TimeoutSec 15
    if ($healthResponse.StatusCode -eq 200) {
        Write-Success "Health endpoint working"
        
        # Test chat endpoint
        $testPayload = @{
            message = "Hello test"
            provider = "openai"
            model = "gpt-4o-mini"
            session_id = "test"
        } | ConvertTo-Json
        
        try {
            $chatResponse = Invoke-WebRequest -Uri "https://$hostname/api/llm/chat" -Method POST -Body $testPayload -ContentType "application/json" -UseBasicParsing -TimeoutSec 15
            if ($chatResponse.StatusCode -eq 200) {
                Write-Success "Chat endpoint working! No fix needed."
                $apiWorking = $true
            }
        }
        catch {
            Write-Warning "Chat endpoint failing (this is what we'll fix)"
        }
    }
}
catch {
    Write-Warning "API endpoints not responding"
}

if ($apiWorking -and -not $ForceRedeploy) {
    Write-Host ""
    Write-Success "🎉 Application is working correctly!"
    Write-Host "Your AI Code Assistant should be functional at: https://$hostname" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Status "Step 2: Fixing configuration issues..."

# Ensure all required secrets are set
$needsRestart = $false

if (-not $hasOpenAI) {
    Write-Warning "OPENAI_API_KEY is missing"
    $apiKey = Read-Host "Please enter your OpenAI API key (starts with sk-)"
    if ($apiKey -and $apiKey.StartsWith("sk-")) {
        flyctl secrets set "OPENAI_API_KEY=$apiKey"
        Write-Success "OpenAI API key set"
        $needsRestart = $true
    } else {
        Write-Error "Invalid API key format"
        exit 1
    }
}

if (-not $hasSecret) {
    Write-Status "Generating SECRET_KEY..."
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secretKey = [Convert]::ToBase64String($bytes)
    flyctl secrets set "SECRET_KEY=$secretKey"
    Write-Success "SECRET_KEY generated and set"
    $needsRestart = $true
}

if (-not $hasFlask) {
    Write-Status "Setting Flask environment..."
    flyctl secrets set "FLASK_ENV=production"
    flyctl secrets set "NODE_ENV=production"
    Write-Success "Environment variables set"
    $needsRestart = $true
}

Write-Host ""
Write-Status "Step 3: Restarting/Redeploying application..."

if ($needsRestart -or $ForceRedeploy) {
    if ($ForceRedeploy) {
        Write-Status "Force redeploying application..."
        flyctl deploy --dockerfile Dockerfile.flyio
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Redeploy completed successfully"
        } else {
            Write-Error "Redeploy failed"
            exit 1
        }
    } else {
        Write-Status "Restarting application to pick up new secrets..."
        flyctl machine restart
        Write-Success "Application restarted"
    }
    
    # Wait for application to start
    Write-Status "Waiting for application to start..."
    Start-Sleep -Seconds 20
} else {
    Write-Status "Restarting application..."
    flyctl machine restart
    Start-Sleep -Seconds 15
}

Write-Host ""
Write-Status "Step 4: Verifying the fix..."

$maxRetries = 3
$retryCount = 0
$fixed = $false

while ($retryCount -lt $maxRetries -and -not $fixed) {
    $retryCount++
    Write-Status "Verification attempt $retryCount/$maxRetries..."
    
    try {
        # Test health endpoint
        $healthResponse = Invoke-WebRequest -Uri "https://$hostname/api/llm/providers" -UseBasicParsing -TimeoutSec 30
        if ($healthResponse.StatusCode -eq 200) {
            Write-Success "Health endpoint working"
            
            # Test chat endpoint
            $testPayload = @{
                message = "Hello, this is a test after fix"
                provider = "openai"
                model = "gpt-4o-mini"
                session_id = "test-fix"
            } | ConvertTo-Json
            
            $chatResponse = Invoke-WebRequest -Uri "https://$hostname/api/llm/chat" -Method POST -Body $testPayload -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
            
            if ($chatResponse.StatusCode -eq 200) {
                Write-Success "Chat endpoint working!"
                $chatResult = $chatResponse.Content | ConvertFrom-Json
                Write-Host "Test response: $($chatResult.response.Substring(0, [Math]::Min(50, $chatResult.response.Length)))..." -ForegroundColor Gray
                $fixed = $true
            }
        }
    }
    catch {
        Write-Warning "Verification failed: $($_.Exception.Message)"
        if ($retryCount -lt $maxRetries) {
            Write-Status "Waiting before retry..."
            Start-Sleep -Seconds 15
        }
    }
}

Write-Host ""
if ($fixed) {
    Write-Host "🎉 SUCCESS! Application is now working correctly!" -ForegroundColor Green
    Write-Host "=" * 50 -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ API endpoints responding correctly" -ForegroundColor Green
    Write-Host "✅ OpenAI integration working" -ForegroundColor Green
    Write-Host "✅ Environment variables configured" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your AI Code Assistant is ready at:" -ForegroundColor White
    Write-Host "🌐 https://$hostname" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Open the URL above in your browser" -ForegroundColor Gray
    Write-Host "2. Go to Code Canvas" -ForegroundColor Gray
    Write-Host "3. Test the AI features" -ForegroundColor Gray
    Write-Host "4. The 500 errors should now be resolved!" -ForegroundColor Gray
} else {
    Write-Host "❌ Fix attempt failed" -ForegroundColor Red
    Write-Host "=" * 30 -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check logs: flyctl logs" -ForegroundColor Gray
    Write-Host "2. Verify API key: Check OpenAI account and billing" -ForegroundColor Gray
    Write-Host "3. Try different model: Use gpt-3.5-turbo instead" -ForegroundColor Gray
    Write-Host "4. SSH debug: flyctl ssh console" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Run with -ForceRedeploy to try a full redeploy:" -ForegroundColor Yellow
    Write-Host ".\auto-fix-and-redeploy.ps1 -ForceRedeploy" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Useful commands:" -ForegroundColor White
Write-Host "  flyctl status     - Check app status" -ForegroundColor Gray
Write-Host "  flyctl logs       - View application logs" -ForegroundColor Gray
Write-Host "  flyctl open       - Open app in browser" -ForegroundColor Gray
