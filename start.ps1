$node22Path = Join-Path $PSScriptRoot "node22\node-v22.11.0-win-x64"
$env:PATH = "$node22Path;$env:PATH"

Write-Host "Using Node: $(node -v)" -ForegroundColor Cyan
Write-Host "Starting Expo..." -ForegroundColor Green

npx expo start --clear @args
