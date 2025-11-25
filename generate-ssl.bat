@echo off
REM 🔒 Generador de certificados SSL para Windows

echo 🔧 Generando certificados SSL para desarrollo...

REM Crear directorio ssl
if not exist ssl mkdir ssl

REM Generar certificados autofirmados
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=MX/ST=State/L=City/O=Ghox/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo ✅ Certificados SSL generados en .\ssl\
echo 🔒 Para usar HTTPS: set USE_SSL=true ^&^& npm start
echo 🌐 Servidor estará disponible en: https://localhost:8080

pause