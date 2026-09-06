# start.ps1 — begin an AstroAtlasI working session.
#
#   Double-click this file, or run:  powershell -ExecutionPolicy Bypass -File start.ps1
#
# It pulls the latest from GitHub, starts the local dev server in its own
# minimized window, and opens the prototype in your default browser with a
# cache-busting URL so you never see a stale build.

param([int]$Port = 8533)

$root  = $PSScriptRoot
$serve = Join-Path $root "mvpI\serve.ps1"
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$url   = "http://localhost:$Port/?t=$stamp"

Write-Host ""
Write-Host "AstroAtlasI - starting work session" -ForegroundColor Cyan
Write-Host "-----------------------------------"
Write-Host "Where we left off :  SESSION_SUMMARY.md"
Write-Host "Open backlog      :  the hammer (Construction Site) tab inside the app"
Write-Host "Shareable test link: https://claude.ai/code/artifact/1add39db-6224-43e5-b802-39b071e33f63"
Write-Host "Rebuild that link  : bash mvpI/build-preview.sh   then re-publish that file to the same artifact"
Write-Host ""

# 1. Pull latest (fast-forward only; never rewrites local work). Non-fatal.
Write-Host "Pulling latest from GitHub..."
try {
    git -C $root pull --ff-only
} catch {
    Write-Host "  (skipped - could not pull: $($_.Exception.Message))" -ForegroundColor DarkYellow
}

# 2. Start the dev server in its own minimized PowerShell window and leave it
#    running. Close that window to stop the server.
Write-Host "Starting dev server on port $Port ..."
Start-Process powershell -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", "`"$serve`"", "-Port", "$Port"
) -WindowStyle Minimized

Start-Sleep -Seconds 2

# 3. Open the app.
Write-Host "Opening $url"
Start-Process $url

Write-Host ""
Write-Host "Dev server is running in a minimized window. Close it when you're done." -ForegroundColor DarkGray
Write-Host "If the port is busy, run:  .\start.ps1 -Port 8534" -ForegroundColor DarkGray
Write-Host ""
