# Quick API Fix - Restart and Test
# This script quickly restarts the app and tests the API

Write-Host "⚡ Quick API Fix and Test" -ForegroundColor Blue
Write-Host "========================" -ForegroundColor Blue

# Check flyctl
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: flyctl not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Restarting application..." -ForegroundColor Cyan
flyctl machine restart

Write-Host "Step 2: Waiting for startup..." -ForegroundColor Cyan
Start-Sleep -Seconds 20

Write-Host "Step 3: Testing API..." -ForegroundColor Cyan

try {
    $statusOutput = flyctl status
    $hostname = ($statusOutput | Select-String "Hostname\s*=\s*(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value.Trim() })
    if (-not $hostname) {
        $hostname = ($statusOutput | Select-String "Hostname:\s*(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value.Trim() })
    }
    
    # Test chat endpoint
    $testPayload = @{
        message = "Hello world test"
        provider = "openai"
        model = "gpt-4o-mini"
        session_id = "quick-test"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "https://$hostname/api/llm/chat" -Method POST -Body $testPayload -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ SUCCESS! API is working!" -ForegroundColor Green
        Write-Host "Your app is ready at: https://$hostname" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ API still failing: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Run the full fix script: .\auto-fix-and-redeploy.ps1" -ForegroundColor Yellow
}
