#!/bin/bash

# 🔒 Generador de certificados SSL para Ghox P2P Voice Server

echo "🔧 Generando certificados SSL para desarrollo..."

# Crear directorio ssl si no existe
mkdir -p ssl

# Generar certificados autofirmados
openssl req -x509 -newkey rsa:4096 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -days 365 \
  -nodes \
  -subj "/C=MX/ST=State/L=City/O=Ghox/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "✅ Certificados SSL generados en ./ssl/"
echo "🔒 Para usar HTTPS: USE_SSL=true npm start"
echo "🌐 Servidor estará disponible en: https://localhost:8080"