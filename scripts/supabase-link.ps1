# INVORA — Lier Supabase CLI au projet njucvyxucacgiztaczkn
# Prérequis : compte Dashboard avec accès org "Invora" + mot de passe DB

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$supabase = Join-Path $PWD "node_modules\.bin\supabase.cmd"
if (-not (Test-Path $supabase)) {
  Write-Host "Installez d'abord : npm install" -ForegroundColor Red
  exit 1
}

Write-Host "1/4 — Déconnexion session CLI précédente (si besoin)..." -ForegroundColor Cyan
& $supabase logout 2>$null

Write-Host "2/4 — Connexion (navigateur ou token)..." -ForegroundColor Cyan
Write-Host "   Token : https://supabase.com/dashboard/account/tokens" -ForegroundColor Yellow
Write-Host "   Puis : `$env:SUPABASE_ACCESS_TOKEN='sbp_...'; & '$supabase' login --token `$env:SUPABASE_ACCESS_TOKEN" -ForegroundColor Yellow
& $supabase login

Write-Host "3/4 — Lien projet INVORA..." -ForegroundColor Cyan
& $supabase link --project-ref njucvyxucacgiztaczkn

Write-Host "4/4 — Push migrations + functions + types..." -ForegroundColor Cyan
& $supabase db push
& $supabase functions deploy validate-scan
& $supabase functions deploy audit-log
& "C:\Program Files\nodejs\npm.cmd" run supabase:types

Write-Host "Terminé." -ForegroundColor Green
