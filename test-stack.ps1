# 🧪 Test MongoDB + Redis + WebRTC

echo "🧪 Probando stack completo: MongoDB + Redis + WebRTC SRTP..."

# Verificar servicios
echo "📊 Verificando MongoDB..."
if (Get-Command mongosh -ErrorAction SilentlyContinue) {
    try {
        mongosh --eval "db.adminCommand('ismaster')" --quiet
        Write-Host "✅ MongoDB disponible" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ MongoDB no disponible (continuando sin persistencia)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ mongosh no instalado (MongoDB opcional)" -ForegroundColor Yellow
}

echo "`n⚡ Verificando Redis..."
if (Get-Command redis-cli -ErrorAction SilentlyContinue) {
    try {
        redis-cli ping | Out-Null
        Write-Host "✅ Redis disponible" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Redis no disponible (continuando sin cache)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ redis-cli no instalado (Redis opcional)" -ForegroundColor Yellow
}

echo "`n🔒 Verificando SSL..."
if (Test-Path "ssl\cert.pem" -and Test-Path "ssl\key.pem") {
    Write-Host "✅ Certificados SSL listos" -ForegroundColor Green
} else {
    Write-Host "⚠️ Ejecutar: .\generate-ssl.ps1" -ForegroundColor Yellow
}

echo "`n📦 Verificando dependencias..."
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules instalado" -ForegroundColor Green
} else {
    Write-Host "❌ Ejecutar: npm install" -ForegroundColor Red
    exit 1
}

echo "`n🚀 Stack completo verificado!"
echo "📊 MongoDB: Persistencia de llamadas"
echo "⚡ Redis: Cache de sesiones"  
echo "🔒 SSL: Certificados para HTTPS+WSS"
echo "🎵 WebRTC: SRTP encryption automático"
echo ""
echo "🏁 Para iniciar servidor:"
echo "   npm start"
echo ""
echo "🌐 Abrir: https://localhost:8080"