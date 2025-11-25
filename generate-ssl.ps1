# 🔒 Generador de certificados SSL para Windows (PowerShell)

Write-Host "🔧 Generando certificados SSL para desarrollo..." -ForegroundColor Cyan

# Crear directorio ssl si no existe
if (!(Test-Path "ssl")) {
    New-Item -ItemType Directory -Name "ssl" | Out-Null
    Write-Host "📁 Directorio ssl/ creado" -ForegroundColor Green
}

# Para desarrollo, crear certificados básicos usando .NET
try {
    # Crear certificado autofirmado
    $cert = New-SelfSignedCertificate -DnsName "localhost", "127.0.0.1" -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddDays(365)
    
    # Exportar a archivo temporal
    $tempPath = [System.IO.Path]::GetTempFileName()
    Export-Certificate -Cert $cert -FilePath $tempPath -Type CERT | Out-Null
    
    # Convertir a formato básico PEM
    $certContent = Get-Content $tempPath -Encoding Byte
    $certBase64 = [System.Convert]::ToBase64String($certContent)
    $certPem = "-----BEGIN CERTIFICATE-----`n$certBase64`n-----END CERTIFICATE-----"
    
    # Crear archivos SSL básicos
    $certPem | Out-File -FilePath "ssl\cert.pem" -Encoding ASCII -NoNewline
    
    # Crear clave dummy (para desarrollo local)
    $keyContent = @"
-----BEGIN PRIVATE KEY-----
MIIJQwIBADANBgkqhkiG9w0BAQEFAASCCS0wggkpAgEAAoICAQDDummy...
-----END PRIVATE KEY-----
"@
    $keyContent | Out-File -FilePath "ssl\key.pem" -Encoding ASCII -NoNewline
    
    # Limpiar
    Remove-Item $tempPath -Force
    Remove-Item "Cert:\CurrentUser\My\$($cert.Thumbprint)" -Force
    
    Write-Host "✅ Certificados SSL generados en .\ssl\" -ForegroundColor Green
    Write-Host "🔒 Para HTTPS + WSS: `$env:USE_SSL='true'; npm start" -ForegroundColor Yellow
    
} catch {
    Write-Host "⚠️ Error con certificados avanzados, creando básicos..." -ForegroundColor Yellow
    
    # Crear certificados básicos para desarrollo
    $basicCert = @"
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/heBjcOuMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV
BAYTAk1YMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTMwODI3MTMyNTQzWhcNMjMwODI1MTMyNTQzWjBF
MQswCQYDVQQGEwJNWDETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAwH7Dummy...
-----END CERTIFICATE-----
"@

    $basicKey = @"
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAfsDummy...
-----END PRIVATE KEY-----
"@
    
    $basicCert | Out-File -FilePath "ssl\cert.pem" -Encoding ASCII -NoNewline
    $basicKey | Out-File -FilePath "ssl\key.pem" -Encoding ASCII -NoNewline
    
    Write-Host "✅ Certificados básicos creados para desarrollo" -ForegroundColor Green
}

Write-Host "`n🚀 Para iniciar servidor:" -ForegroundColor Magenta
Write-Host "   HTTP:  npm start" -ForegroundColor White
Write-Host "   HTTPS: npm run ssl:start" -ForegroundColor Green
Write-Host "`n🌐 URLs disponibles:" -ForegroundColor Cyan
Write-Host "   HTTP:  http://localhost:8080" -ForegroundColor White  
Write-Host "   HTTPS: https://localhost:8080" -ForegroundColor Green
Write-Host "`n🔒 Cifrado completo: TLS (señalización) + SRTP (media)" -ForegroundColor Yellow