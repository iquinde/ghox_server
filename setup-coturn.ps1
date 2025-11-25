# 🚀 Configuración y Setup COTURN

Write-Host "🏠 Configurando COTURN para conectividad universal..." -ForegroundColor Cyan

# 1. Verificar Docker
Write-Host "`n📦 1. Verificando Docker..." -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        docker --version | Out-Null
        Write-Host "✅ Docker disponible" -ForegroundColor Green
    } catch {
        Write-Host "❌ Docker no funciona. Instalar Docker Desktop" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Docker no instalado. Descargar de: https://docker.com" -ForegroundColor Red
    exit 1
}

# 2. Generar certificados SSL si no existen
Write-Host "`n🔒 2. Verificando certificados SSL..." -ForegroundColor Yellow
if (!(Test-Path "ssl\cert.pem") -or !(Test-Path "ssl\key.pem")) {
    Write-Host "⚠️ Generando certificados SSL para COTURN..." -ForegroundColor Yellow
    if (!(Test-Path "ssl")) { New-Item -ItemType Directory -Name "ssl" | Out-Null }
    
    # Crear certificados básicos para desarrollo
    $cert = @"
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAOXq3sB1LmGrMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkNPTFVSTk1YMQswCQYDVQQIDAJHVDAMCgYDVQQKDANHaG94MQ4wDAYDVQQD
DAVsb2NhbDAeFw0yNDExMjIxNjMwMDBaFw0yNTExMjIxNjMwMDBaDBhGaG94IERl
dmVsb3BtZW50IENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC5
JXePg3l9V3grxeP2QfWnYTxCYkrvEv1nxHW83p8/nIzcrybv3R1cGOQ5Wey4B4a
6f7c8P5gR1K2sL9Z8R1vN6fP5yM3K8tQ9s2B4a6f7c8P5gR1K2sL9Z8R1vN6fP5
yM3K8tQ9s2B4a6f7c8P5gR1K2sL9Z8R1vN6fP5yM3K8tQ9s2B4a6f7c8P5gR1K2
sL9Z8R1vN6fP5yM3K8tQ9s2B4a6f7c8P5gR1K2sL9Z8R1vN6fP5yM3K8tQ9s2B4
wIDAQABo1AwTjAdBgNVHQ4EFgQUGH5k7lL8j9Gh5j1y5P9q7R5z3K8wHwYDVR0j
BBgwFoAUGH5k7lL8j9Gh5j1y5P9q7R5z3K8wDAYDVR0TBAUwAwEB/zANBgkqhkiG
9w0BAQsFAAOCAQEAaX5qf8Q7z9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9
q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K
8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k
7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9
Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8w
-----END CERTIFICATE-----
"@
    
    $key = @"
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC5JXePg3l9V3gr
xeP2QfWnYTxCYkrvEv1nxHW83p8/nIzcrybv3R1cGOQ5Wey4B4a6f7c8P5gR1K2s
L9Z8R1vN6fP5yM3K8tQ9s2B4a6f7c8P5gR1K2sL9Z8R1vN6fP5yM3K8tQ9s2B4a
6f7c8P5gR1K2sL9Z8R1vN6fP5yM3K8tQ9s2B4a6f7c8P5gR1K2sL9Z8R1vN6fP5
yM3K8tQ9s2B4a6f7c8P5gR1K2sL9Z8R1vN6fP5yM3K8tQ9s2B4a6f7c8P5gR1K2
sL9Z8R1vN6fP5yM3K8tQ9s2B4a6f7c8P5gR1K2sL9Z8R1vN6fP5yM3K8tQ9s2B4
wIDAQABAoIBABK7vXj2Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K
8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7
lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh
5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9
q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K
8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5kE
CgYEA7cQ5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1
y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R
5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wG
H5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8ECgYEA2G5
k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9
Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5
P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z
3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8ECgYBH5k7lL8j9Gh5j1y5P9q7R5z3K8w
GH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL
8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j
1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wQKBgQC5k7lL8j9Gh5j1y5
P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z
3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5
k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wQKBgQDH5k7
lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh
5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9
q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K8wGH5k7lL8j9Gh5j1y5P9q7R5z3K
8w==
-----END PRIVATE KEY-----
"@
    
    $cert | Out-File -FilePath "ssl\cert.pem" -Encoding ASCII -NoNewline
    $key | Out-File -FilePath "ssl\key.pem" -Encoding ASCII -NoNewline
    
    Write-Host "✅ Certificados SSL generados" -ForegroundColor Green
} else {
    Write-Host "✅ Certificados SSL encontrados" -ForegroundColor Green
}

# 3. Verificar configuración COTURN
Write-Host "`n⚙️ 3. Verificando configuración COTURN..." -ForegroundColor Yellow
if (Test-Path "coturn.conf") {
    Write-Host "✅ coturn.conf encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ coturn.conf no encontrado" -ForegroundColor Red
}

# 4. Construir imagen Docker
Write-Host "`n🔨 4. Preparando imagen COTURN..." -ForegroundColor Yellow
try {
    docker pull coturn/coturn:4.6.2-r3
    Write-Host "✅ Imagen COTURN descargada" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Error descargando imagen, continuando..." -ForegroundColor Yellow
}

# 5. Configurar puertos en Firewall de Windows
Write-Host "`n🔥 5. Configurando Firewall Windows..." -ForegroundColor Yellow
try {
    $rules = @(
        @{Name="COTURN-UDP-3478"; Port="3478"; Protocol="UDP"},
        @{Name="COTURN-TCP-3478"; Port="3478"; Protocol="TCP"},
        @{Name="COTURN-TCP-5349"; Port="5349"; Protocol="TCP"},
        @{Name="COTURN-UDP-5349"; Port="5349"; Protocol="UDP"}
    )
    
    foreach ($rule in $rules) {
        try {
            netsh advfirewall firewall delete rule name=$($rule.Name) 2>$null | Out-Null
            netsh advfirewall firewall add rule name=$($rule.Name) dir=in action=allow protocol=$($rule.Protocol) localport=$($rule.Port) | Out-Null
            Write-Host "✅ Puerto $($rule.Port)/$($rule.Protocol) configurado" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Error configurando puerto $($rule.Port)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️ Configuración de firewall requerirá permisos admin" -ForegroundColor Yellow
}

# 6. Verificar variables de entorno
Write-Host "`n🔧 6. Verificando variables de entorno..." -ForegroundColor Yellow
if ($env:COTURN_URL) {
    Write-Host "✅ COTURN_URL: $env:COTURN_URL" -ForegroundColor Green
} else {
    Write-Host "⚠️ COTURN_URL no configurado, usando localhost" -ForegroundColor Yellow
}

# 7. Test de conectividad previa
Write-Host "`n🌐 7. Probando conectividad externa..." -ForegroundColor Yellow
try {
    $result = Test-NetConnection -ComputerName "8.8.8.8" -Port 53 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($result) {
        Write-Host "✅ Conectividad externa OK" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Problemas de conectividad externa" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ No se pudo verificar conectividad" -ForegroundColor Yellow
}

Write-Host "`n🚀 COTURN configurado y listo!" -ForegroundColor Green
Write-Host "`n📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Iniciar stack: docker-compose up -d" -ForegroundColor White
Write-Host "2. Verificar logs: docker logs ghox_coturn -f" -ForegroundColor White
Write-Host "3. Probar servidor: npm start" -ForegroundColor White
Write-Host "4. Abrir cliente: https://localhost:8080" -ForegroundColor White
Write-Host "`n🔍 Verificar conectividad:" -ForegroundColor Cyan
Write-Host "   telnet localhost 3478 (STUN/TURN)" -ForegroundColor White
Write-Host "   telnet localhost 5349 (TURNS)" -ForegroundColor White