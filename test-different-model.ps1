# Test with Different OpenAI Model
# This script tests the API with gpt-3.5-turbo instead of gpt-4o-mini

Write-Host "🧪 Testing with Different OpenAI Model" -ForegroundColor Blue
Write-Host "======================================" -ForegroundColor Blue

# Get app URL
$statusOutput = flyctl status
$hostname = ($statusOutput | Select-String "Hostname\s*=\s*(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value.Trim() })
if (-not $hostname) {
    $hostname = ($statusOutput | Select-String "Hostname:\s*(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value.Trim() })
}
if (-not $hostname) {
    $hostname = "ai-code-assistant.fly.dev"
}

Write-Host "Testing app at: https://$hostname" -ForegroundColor Gray

# Test different models
$models = @("gpt-3.5-turbo", "gpt-4o-mini", "gpt-4o")

foreach ($model in $models) {
    Write-Host ""
    Write-Host "Testing model: $model" -ForegroundColor Cyan
    
    try {
        $testPayload = @{
            message = "Hello, test with $model"
            provider = "openai"
            model = $model
            session_id = "model-test"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "https://$hostname/api/llm/chat" -Method POST -Body $testPayload -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ SUCCESS with $model!" -ForegroundColor Green
            $result = $response.Content | ConvertFrom-Json
            Write-Host "Response: $($result.response.Substring(0, [Math]::Min(50, $result.response.Length)))..." -ForegroundColor Gray
            break
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ Failed with $model (Status: $statusCode)" -ForegroundColor Red
        
        if ($statusCode -eq 401) {
            Write-Host "   → 401 Unauthorized: API key issue" -ForegroundColor Yellow
        } elseif ($statusCode -eq 403) {
            Write-Host "   → 403 Forbidden: Model access issue" -ForegroundColor Yellow
        } elseif ($statusCode -eq 429) {
            Write-Host "   → 429 Rate Limited: Too many requests" -ForegroundColor Yellow
        } else {
            Write-Host "   → Error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "💡 Recommendations:" -ForegroundColor White
Write-Host "1. If all models fail with 401: Check your OpenAI API key" -ForegroundColor Gray
Write-Host "2. If some models work: Use the working model in settings" -ForegroundColor Gray
Write-Host "3. Check OpenAI account: https://platform.openai.com/usage" -ForegroundColor Gray
Write-Host "4. Verify billing: https://platform.openai.com/account/billing" -ForegroundColor Gray
