# Simple Fix for Fly.io API Issues
# Compatible with all flyctl versions

Write-Host "🔧 Simple Fly.io API Fix" -ForegroundColor Blue
Write-Host "========================" -ForegroundColor Blue

# Check flyctl
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: flyctl not found" -ForegroundColor Red
    exit 1
}

# Check auth
try {
    flyctl auth whoami | Out-Null
    Write-Host "✅ Authenticated with Fly.io" -ForegroundColor Green
}
catch {
    Write-Host "❌ Not logged in. Run: flyctl auth login" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Checking secrets..." -ForegroundColor Cyan

# Check if OpenAI API key is set
$secrets = flyctl secrets list
if ($secrets -match "OPENAI_API_KEY") {
    Write-Host "✅ OPENAI_API_KEY is set" -ForegroundColor Green
} else {
    Write-Host "❌ OPENAI_API_KEY is missing" -ForegroundColor Red
    $apiKey = Read-Host "Enter your OpenAI API key (starts with sk-)"
    if ($apiKey -and $apiKey.StartsWith("sk-")) {
        flyctl secrets set "OPENAI_API_KEY=$apiKey"
        Write-Host "✅ API key set" -ForegroundColor Green
    } else {
        Write-Host "❌ Invalid API key" -ForegroundColor Red
        exit 1
    }
}

# Set other required secrets if missing
if (-not ($secrets -match "SECRET_KEY")) {
    Write-Host "Setting SECRET_KEY..." -ForegroundColor Yellow
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secretKey = [Convert]::ToBase64String($bytes)
    flyctl secrets set "SECRET_KEY=$secretKey"
}

if (-not ($secrets -match "FLASK_ENV")) {
    Write-Host "Setting environment variables..." -ForegroundColor Yellow
    flyctl secrets set "FLASK_ENV=production"
    flyctl secrets set "NODE_ENV=production"
}

Write-Host ""
Write-Host "Step 2: Restarting application..." -ForegroundColor Cyan
flyctl machine restart

Write-Host "Step 3: Waiting for startup..." -ForegroundColor Cyan
Start-Sleep -Seconds 25

Write-Host "Step 4: Getting app URL..." -ForegroundColor Cyan
$statusOutput = flyctl status
$hostname = $null

# Try different patterns to find hostname
$patterns = @(
    "Hostname\s*=\s*(.+)",
    "Hostname:\s*(.+)",
    "URL:\s*https://(.+)",
    "App URL:\s*https://(.+)"
)

foreach ($pattern in $patterns) {
    $match = $statusOutput | Select-String $pattern
    if ($match) {
        $hostname = $match.Matches[0].Groups[1].Value.Trim()
        break
    }
}

if (-not $hostname) {
    # Try to get app name and construct URL
    $appName = ($statusOutput | Select-String "App\s*=\s*(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value.Trim() })
    if (-not $appName) {
        $appName = ($statusOutput | Select-String "Name:\s*(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value.Trim() })
    }
    if ($appName) {
        $hostname = "$appName.fly.dev"
    }
}

if ($hostname) {
    Write-Host "✅ App URL: https://$hostname" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Step 5: Testing API..." -ForegroundColor Cyan
    
    try {
        # Test health endpoint first
        $healthResponse = Invoke-WebRequest -Uri "https://$hostname/api/llm/providers" -UseBasicParsing -TimeoutSec 30
        if ($healthResponse.StatusCode -eq 200) {
            Write-Host "✅ Health endpoint working" -ForegroundColor Green
            
            # Test chat endpoint
            $testPayload = @{
                message = "Hello, testing API after fix"
                provider = "openai"
                model = "gpt-4o-mini"
                session_id = "test-fix"
            } | ConvertTo-Json
            
            $chatResponse = Invoke-WebRequest -Uri "https://$hostname/api/llm/chat" -Method POST -Body $testPayload -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
            
            if ($chatResponse.StatusCode -eq 200) {
                Write-Host ""
                Write-Host "🎉 SUCCESS! API is working!" -ForegroundColor Green
                Write-Host "=" * 40 -ForegroundColor Green
                Write-Host ""
                Write-Host "✅ OpenAI API integration working" -ForegroundColor Green
                Write-Host "✅ Chat endpoint responding" -ForegroundColor Green
                Write-Host "✅ Environment configured correctly" -ForegroundColor Green
                Write-Host ""
                Write-Host "Your AI Code Assistant is ready!" -ForegroundColor White
                Write-Host "🌐 https://$hostname" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "Next steps:" -ForegroundColor White
                Write-Host "1. Open the URL above" -ForegroundColor Gray
                Write-Host "2. Go to Code Canvas" -ForegroundColor Gray
                Write-Host "3. Test AI features - no more 500 errors!" -ForegroundColor Gray
            } else {
                Write-Host "❌ Chat endpoint still failing" -ForegroundColor Red
                Write-Host "Response: $($chatResponse.StatusCode)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Health endpoint failing" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ API test failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Check logs: flyctl logs" -ForegroundColor Gray
        Write-Host "2. Verify OpenAI API key is valid" -ForegroundColor Gray
        Write-Host "3. Check OpenAI account has credits" -ForegroundColor Gray
        Write-Host "4. Try again in a few minutes" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Could not determine app URL" -ForegroundColor Red
    Write-Host "Check manually with: flyctl status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Useful commands:" -ForegroundColor White
Write-Host "  flyctl status     - Check app status" -ForegroundColor Gray
Write-Host "  flyctl logs       - View logs" -ForegroundColor Gray
Write-Host "  flyctl open       - Open app" -ForegroundColor Gray
