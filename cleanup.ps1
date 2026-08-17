# ============================================
#   NETTOYAGE COMPLET - CRM IA
# ============================================

$projectPath = "C:\Users\HP ELITEBOOK 840 G8\Desktop\crm_ai_project"
Set-Location $projectPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   NETTOYAGE COMPLET - CRM IA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# [1/7] Supprimer ui/ (Streamlit obsolète)
Write-Host "[1/7] Suppression de ui/ (Streamlet -> React)..." -ForegroundColor Yellow
$uiPath = Join-Path $projectPath "ui"
if (Test-Path $uiPath) {
    Remove-Item -Path $uiPath -Recurse -Force
    Write-Host "[OK] ui/ supprime" -ForegroundColor Green
} else {
    Write-Host "[INFO] ui/ deja supprime" -ForegroundColor Gray
}

# [2/7] Supprimer __pycache__
Write-Host "`n[2/7] Suppression des caches Python..." -ForegroundColor Yellow
Get-ChildItem -Path $projectPath -Recurse -Directory -Filter "__pycache__" | ForEach-Object {
    Remove-Item -Path $_.FullName -Recurse -Force
}
Get-ChildItem -Path $projectPath -Recurse -File -Filter "*.pyc" | Remove-Item -Force
Get-ChildItem -Path $projectPath -Recurse -File -Filter "*.pyo" | Remove-Item -Force
Write-Host "[OK] Caches Python supprimes" -ForegroundColor Green

# [3/7] Supprimer SQLite
Write-Host "`n[3/7] Suppression de SQLite..." -ForegroundColor Yellow
$dbPath = Join-Path $projectPath "crm.db"
if (Test-Path $dbPath) {
    Remove-Item -Path $dbPath -Force
    Write-Host "[OK] crm.db supprime" -ForegroundColor Green
}
Get-ChildItem -Path $projectPath -Recurse -File -Filter "*.sqlite*" | Remove-Item -Force
Write-Host "[OK] Bases SQLite supprimees" -ForegroundColor Green

# [4/7] Supprimer exports
Write-Host "`n[4/7] Suppression des exports..." -ForegroundColor Yellow
$exportPath = Join-Path $projectPath "rapport_agents.csv"
if (Test-Path $exportPath) {
    Remove-Item -Path $exportPath -Force
}
Get-ChildItem -Path $projectPath -File -Filter "*.xlsx" | Remove-Item -Force
Write-Host "[OK] Exports supprimes" -ForegroundColor Green

# [5/7] Supprimer logs
Write-Host "`n[5/7] Suppression des logs..." -ForegroundColor Yellow
$logsPath = Join-Path $projectPath "logs"
if (Test-Path $logsPath) {
    Remove-Item -Path $logsPath -Recurse -Force
}
Get-ChildItem -Path $projectPath -Recurse -File -Filter "*.log" | Remove-Item -Force
Get-ChildItem -Path $projectPath -Recurse -File -Filter "*.tmp" | Remove-Item -Force
Write-Host "[OK] Logs supprimes" -ForegroundColor Green

# [6/7] Supprimer dossiers temporaires
Write-Host "`n[6/7] Suppression des dossiers temporaires..." -ForegroundColor Yellow
@("tmp", "temp", "__pycache__") | ForEach-Object {
    $path = Join-Path $projectPath $_
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force
    }
}
Write-Host "[OK] Dossiers temporaires supprimes" -ForegroundColor Green

# [7/7] rag_db (optionnel - demander confirmation)
Write-Host "`n[7/7] Traitement de rag_db/..." -ForegroundColor Yellow
$ragPath = Join-Path $projectPath "rag_db"
if (Test-Path $ragPath) {
    $confirm = Read-Host "ATTENTION: rag_db/ contient les donnees vectorielles du chatbot. Supprimer ? [O/N]"
    if ($confirm -eq "O" -or $confirm -eq "o") {
        Remove-Item -Path $ragPath -Recurse -Force
        Write-Host "[OK] rag_db/ supprime" -ForegroundColor Green
    } else {
        Write-Host "[INFO] rag_db/ conserve" -ForegroundColor Gray
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   NETTOYAGE TERMINE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nStructure restante:" -ForegroundColor Cyan
Get-ChildItem -Path $projectPath -Directory | Format-Table Name, LastWriteTime
Write-Host "`nFichiers a la racine:" -ForegroundColor Cyan
Get-ChildItem -Path $projectPath -File | Format-Table Name, Length, LastWriteTime