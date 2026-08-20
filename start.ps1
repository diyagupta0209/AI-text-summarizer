$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Stopping old Node/Vite processes..."
cmd /c "taskkill /F /IM node.exe >nul 2>nul"

Write-Host "Updating to the fixed branch..."
git fetch origin
git checkout cursor/ai-text-summarizer-fullstack-6c7b
git reset --hard origin/cursor/ai-text-summarizer-fullstack-6c7b

if (Test-Path "frontend/.git") {
  Write-Host "Removing leftover frontend git metadata..."
  Remove-Item -Recurse -Force "frontend/.git"
}

git clean -fd

if (Select-String -Path "frontend\src\App.jsx" -Pattern "fetch\(" -Quiet) {
  throw "Old frontend is still present. Delete the project folder and clone again."
}

Set-Location frontend
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path dist) { Remove-Item -Recurse -Force dist }

Write-Host "Installing frontend packages..."
npm install

Write-Host "Starting the app. Open http://localhost:5173 and press Ctrl+Shift+R"
npm run dev
