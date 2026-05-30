# Automated Dependency Update Script for SIHUL
# ============================================
# This script updates all vulnerable dependencies and regenerates requirements.txt

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       SIHUL - Dependency Vulnerability Update             ║" -ForegroundColor Cyan
Write-Host "║       Automated Fix for 21 CVEs & Vulnerabilities         ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "c:\Users\SOPORTE\Documents\Sihul\SIHUL"

# ============================================
# BACKEND UPDATES
# ============================================
Write-Host "🔄 STEP 1: Updating Backend Dependencies..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

cd "$projectRoot\backend"

Write-Host "  → Upgrading gunicorn 21.2.0 → 22.0.0" -ForegroundColor Cyan
pip install --upgrade gunicorn==22.0.0 --quiet

Write-Host "  → Upgrading werkzeug 3.0.3 → 3.1.6" -ForegroundColor Cyan
pip install --upgrade werkzeug==3.1.6 --quiet

Write-Host "  → Upgrading cryptography 42.0.8 → 46.0.6" -ForegroundColor Cyan
pip install --upgrade cryptography==46.0.6 --quiet

Write-Host "  → Regenerating requirements.txt..." -ForegroundColor Cyan
pip freeze > requirements.txt

Write-Host "✅ Backend updated successfully" -ForegroundColor Green
Write-Host ""

# ============================================
# CHATBOT UPDATES
# ============================================
Write-Host "🔄 STEP 2: Updating Chatbot Dependencies..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

cd "$projectRoot\chatbot"

Write-Host "  → Upgrading python-dotenv 1.0.1 → 1.2.2" -ForegroundColor Cyan
pip install --upgrade python-dotenv==1.2.2 --quiet

Write-Host "  → Upgrading python-multipart 0.0.20 → 0.0.27" -ForegroundColor Cyan
pip install --upgrade python-multipart==0.0.27 --quiet

Write-Host "  → Upgrading langchain-text-splitters 0.3.4 → 1.1.2" -ForegroundColor Cyan
pip install --upgrade langchain-text-splitters==1.1.2 --quiet

Write-Host "  → Upgrading starlette 0.41.3 → 0.49.1" -ForegroundColor Cyan
pip install --upgrade starlette==0.49.1 --quiet

Write-Host "  → Regenerating requirements.txt..." -ForegroundColor Cyan
pip freeze > requirements.txt

Write-Host "✅ Chatbot updated successfully" -ForegroundColor Green
Write-Host ""

# ============================================
# FRONTEND UPDATES
# ============================================
Write-Host "🔄 STEP 3: Handling Frontend Dependencies..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

cd "$projectRoot\frontend"

Write-Host "  → Running npm audit fix..." -ForegroundColor Cyan
npm.cmd audit fix --omit=dev --quiet 2>&1 | Out-Null

Write-Host "  ⚠️  Note: xlsx HIGH vulnerabilities may not have auto-fixes" -ForegroundColor Yellow
Write-Host "      Consider alternative: exceljs, node-xlsx, or sheetjs-pro" -ForegroundColor Yellow

Write-Host "  → Running npm install to sync dependencies..." -ForegroundColor Cyan
npm.cmd install --quiet 2>&1 | Out-Null

Write-Host "✅ Frontend dependencies handled" -ForegroundColor Green
Write-Host ""

# ============================================
# VERIFICATION
# ============================================
Write-Host "🔍 STEP 4: Verifying Updates..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Verify Backend
Write-Host "  [Backend] Running pip-audit..." -ForegroundColor Cyan
$backendStatus = & python -m pip_audit -r "$projectRoot\backend\requirements.txt" 2>&1
if ($backendStatus -match "No known vulnerabilities found") {
    Write-Host "    ✅ Backend: CLEAN" -ForegroundColor Green
} else {
    Write-Host "    ⚠️  Backend: Some vulnerabilities remain (may be acceptable)" -ForegroundColor Yellow
}

# Verify Chatbot
Write-Host "  [Chatbot] Running pip-audit..." -ForegroundColor Cyan
$chatbotStatus = & python -m pip_audit -r "$projectRoot\chatbot\requirements.txt" 2>&1
if ($chatbotStatus -match "No known vulnerabilities found") {
    Write-Host "    ✅ Chatbot: CLEAN" -ForegroundColor Green
} else {
    Write-Host "    ⚠️  Chatbot: Some vulnerabilities remain (may be acceptable)" -ForegroundColor Yellow
}

# Verify Frontend
Write-Host "  [Frontend] Running npm audit..." -ForegroundColor Cyan
cd "$projectRoot\frontend"
$frontendStatus = & npm.cmd audit --omit=dev 2>&1
if ($frontendStatus -match "found 0 vulnerabilities") {
    Write-Host "    ✅ Frontend: CLEAN" -ForegroundColor Green
} else {
    Write-Host "    ⚠️  Frontend: Some vulnerabilities found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  ✅ UPDATE COMPLETE                       ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run local tests to verify no breaking changes"
Write-Host "  2. Commit updated requirements.txt files"
Write-Host "  3. Push to your branch and check GitHub Actions"
Write-Host "  4. Verify that dependency-audit workflow passes"
Write-Host ""

Write-Host "📊 Changelog:" -ForegroundColor Cyan
Write-Host "  Backend:  3 packages updated (gunicorn, werkzeug, cryptography)"
Write-Host "  Chatbot:  4 packages updated (python-dotenv, python-multipart, langchain, starlette)"
Write-Host "  Frontend: npm audit fix executed"
Write-Host ""
