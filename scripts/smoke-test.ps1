# ---------------------------------------------------------------------------
# smoke-test.ps1 — prove that the app builds, starts and serves from a clean
# clone. Requires only Docker; no Firebase or Gemini accounts needed.
#
# Usage:
#   .\scripts\smoke-test.ps1
#
# Exit code:
#   0  – all checks passed
#   1  – one or more checks failed
# ---------------------------------------------------------------------------
$ErrorActionPreference = "Stop"

$ComposeProject = "ruralhealth-smoke"

function Cleanup {
    Write-Host ">>> Tearing down..."
    docker compose -p $ComposeProject down -v --remove-orphans 2>$null
}

trap { Cleanup } EXIT

try {
    Write-Host ">>> Building the Docker stack (this may take a few minutes)..."
    docker compose -p $ComposeProject up --build -d
    if ($LASTEXITCODE -ne 0) { throw "Docker compose build failed." }

    Write-Host ">>> Waiting for the health endpoint..."
    $passed = $false
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "    Health check passed on attempt $attempt"
                $passed = $true
                break
            }
        } catch {
            # Health endpoint not ready yet
        }
        Start-Sleep -Seconds 2
    }
    if (-not $passed) {
        Write-Host "FAIL: Health check never succeeded after 30 attempts."
        docker compose -p $ComposeProject logs web
        exit 1
    }

    Write-Host ">>> Verifying the frontend bundle is served..."
    $indexResponse = Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing
    if ($indexResponse.Content -notmatch '<!doctype html>') {
        Write-Host "FAIL: Frontend bundle was not served."
        exit 1
    }
    Write-Host "    Frontend bundle OK"

    Write-Host ">>> Testing the registration API endpoint..."
    $body = '{"email":"smoke@example.com","full_name":"Smoke Test","password":"smoke-test-pass"}'
    $registerResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing
    if ($registerResponse.Content -notmatch '"role"') {
        Write-Host "FAIL: Registration did not return a role."
        Write-Host $registerResponse.Content
        exit 1
    }
    Write-Host "    Registration API OK"

    Write-Host ""
    Write-Host "========================================="
    Write-Host "  All smoke tests passed!"
    Write-Host "========================================="
} finally {
    Cleanup
}
