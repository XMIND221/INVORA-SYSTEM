# INVORA — Setup Supabase complet (lit .env)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$supabase = Join-Path $PWD "node_modules\.bin\supabase.cmd"
if (-not (Test-Path $supabase)) { throw "Exécutez npm install" }

function Get-EnvValue([string]$Key) {
  $line = Get-Content ".env" -ErrorAction SilentlyContinue | Where-Object { $_ -match "^$Key=" }
  if ($line) { return ($line -split "=", 2)[1].Trim() }
  return $null
}

$token = Get-EnvValue "SUPABASE_ACCESS_TOKEN"
$dbPass = Get-EnvValue "SUPABASE_DB_PASSWORD"
if (-not $token -or -not $dbPass) {
  Write-Host "Ajoutez SUPABASE_ACCESS_TOKEN et SUPABASE_DB_PASSWORD dans .env" -ForegroundColor Red
  exit 1
}

$env:SUPABASE_ACCESS_TOKEN = $token
& $supabase login --token $token | Out-Null
& $supabase link --project-ref njucvyxucacgiztaczkn --password $dbPass
& $supabase db push
& $supabase functions deploy validate-scan
& $supabase functions deploy audit-log
& "C:\Program Files\nodejs\npm.cmd" run supabase:types
Write-Host "Supabase OK — projet lié, migrations, functions, types." -ForegroundColor Green
