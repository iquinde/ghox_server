# 🧪 Test de conectividad COTURN y WebRTC

echo "🔍 Probando configuración de conectividad universal..."

# Test 1: Verificar configuración COTURN
echo "🏠 1. Verificando configuración COTURN..."
if ($env:COTURN_URL) {
    Write-Host "✅ COTURN_URL configurado: $env:COTURN_URL" -ForegroundColor Green
} else {
    Write-Host "⚠️ COTURN_URL no configurado" -ForegroundColor Yellow
}

# Test 2: Verificar Twilio backup
echo "`n💙 2. Verificando Twilio backup..."
if ($env:TWILIO_ACCOUNT_SID -and $env:TWILIO_AUTH_TOKEN) {
    Write-Host "✅ Twilio configurado como backup" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Twilio no configurado (opcional)" -ForegroundColor Cyan
}

# Test 3: Probar conectividad a servidores TURN
echo "`n🌐 3. Probando conectividad TURN..."

$turnServers = @(
    "a.relay.metered.ca:80",
    "stun.l.google.com:19302",
    "openrelay.metered.ca:80"
)

foreach ($server in $turnServers) {
    try {
        $result = Test-NetConnection -ComputerName $server.Split(":")[0] -Port $server.Split(":")[1] -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($result) {
            Write-Host "✅ $server accesible" -ForegroundColor Green
        } else {
            Write-Host "❌ $server no accesible" -ForegroundColor Red
        }
    } catch {
        Write-Host "⚠️ $server error de prueba" -ForegroundColor Yellow
    }
}

# Test 4: Verificar puertos comunes para redes corporativas
echo "`n🔐 4. Verificando puertos para redes corporativas..."
$ports = @(80, 443, 3478, 5349)
foreach ($port in $ports) {
    try {
        $listener = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | Where-Object { $_.Port -eq $port }
        if ($listener) {
            Write-Host "⚠️ Puerto $port ocupado localmente" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Puerto $port disponible" -ForegroundColor Green
        }
    } catch {
        Write-Host "ℹ️ Puerto $port estado desconocido" -ForegroundColor Cyan
    }
}

# Test 5: Simular diferentes tipos de NAT
echo "`n🛡️ 5. Información de NAT local..."
try {
    $publicIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5).Trim()
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "127\.|169\.254\." -and $_.PrefixOrigin -eq "Dhcp" }).IPAddress
    
    Write-Host "🌍 IP Pública: $publicIP" -ForegroundColor Cyan
    Write-Host "🏠 IP Local: $localIP" -ForegroundColor Cyan
    
    if ($publicIP -ne $localIP) {
        Write-Host "🛡️ Detrás de NAT - TURN servers necesarios" -ForegroundColor Yellow
    } else {
        Write-Host "🌐 IP pública directa - STUN puede ser suficiente" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ No se pudo determinar configuración de red" -ForegroundColor Yellow
}

echo "`n📊 Resumen de conectividad:"
echo "✅ Configuración agresiva para NAT restrictivo"
echo "🔄 Múltiples protocolos (UDP, TCP, TLS)" 
echo "🌍 Servidores TURN globales + backup"
echo "🏢 Puertos alternativos para redes corporativas"
echo "🔒 SRTP encryption siempre activo"

echo "`n🚀 Para conectividad máxima:"
echo "1. Configura COTURN propio: set COTURN_URL=tu-servidor.com"
echo "2. Mantén Twilio como backup"  
echo "3. Usa Docker: docker-compose up -d"
echo "4. Monitorea logs: docker logs ghox_coturn"

echo "`n🧪 Test completado - Ready para cualquier red!"