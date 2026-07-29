#!/usr/bin/env pwsh
# Auto-commit and push script

param(
    [string]$message = ""
)

# Get git diff stats
$stats = git diff --stat
$shortstat = git diff --shortstat

if (-not $stats) {
    Write-Host "❌ No changes to commit" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Changes:" -ForegroundColor Cyan
Write-Host $shortstat

# Auto-generate commit message if not provided
if (-not $message) {
    $files = git diff --name-only
    $fileCount = ($files | Measure-Object).Count
    
    # Detect commit type
    $type = "chore"
    if ($files -match "\.tsx?$|\.jsx?$") { $type = "feat" }
    if ($files -match "bug|fix") { $type = "fix" }
    if ($files -match "style|css|tailwind") { $type = "style" }
    if ($files -match "test|spec") { $type = "test" }
    if ($files -match "\.md$|docs") { $type = "docs" }
    
    $message = "${type}: update $fileCount file(s)"
}

Write-Host "💬 Commit: $message" -ForegroundColor Yellow

# Confirm
$confirm = Read-Host "Push to main? (y/n)"
if ($confirm -ne "y") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit 0
}

# Execute
git add .
git commit -m $message
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Pushed to main" -ForegroundColor Green
    Write-Host "🚀 Vercel deploying..." -ForegroundColor Cyan
} else {
    Write-Host "❌ Push failed" -ForegroundColor Red
    exit 1
}
