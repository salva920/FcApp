# Script para descargar modelos de face-api.js
# Ejecutar desde la raiz del proyecto: .\scripts\download-face-models.ps1

Write-Host "Descargando modelos de face-api.js..." -ForegroundColor Cyan

# Crear directorio si no existe
$modelsDir = "public\models"
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null
    Write-Host "Directorio creado: $modelsDir" -ForegroundColor Green
}

# Base URL de los modelos
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# Lista de archivos a descargar
$files = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2",
    "face_expression_model-weights_manifest.json",
    "face_expression_model-shard1"
)

$successCount = 0
$errorCount = 0

foreach ($file in $files) {
    $url = "$baseUrl/$file"
    $outputPath = Join-Path $modelsDir $file
    
    try {
        Write-Host "Descargando: $file..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $url -OutFile $outputPath -ErrorAction Stop
        Write-Host "Descargado: $file" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "Error descargando $file : $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "Resumen:" -ForegroundColor Cyan
Write-Host "   Exitosos: $successCount" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "   Errores: $errorCount" -ForegroundColor Red
}

if ($errorCount -eq 0) {
    Write-Host ""
    Write-Host "Todos los modelos se descargaron correctamente!" -ForegroundColor Green
    Write-Host "Los modelos estan en: $modelsDir" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Algunos modelos no se pudieron descargar. Intenta descargarlos manualmente." -ForegroundColor Yellow
    Write-Host "Ve a: https://github.com/justadudewhohacks/face-api.js/tree/master/weights" -ForegroundColor Cyan
}
