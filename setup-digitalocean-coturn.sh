#!/bin/bash

# 🚀 Script de Instalación COTURN para DigitalOcean
# Ejecutar como root en Ubuntu 22.04 LTS

echo "🚀 Configurando COTURN en DigitalOcean..."

# 1. Actualizar sistema
apt update && apt upgrade -y

# 2. Instalar COTURN
apt install coturn -y

# 3. Habilitar servicio
systemctl enable coturn

# 4. Configurar firewall
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS  
ufw allow 3478/tcp    # COTURN TCP
ufw allow 3478/udp    # COTURN UDP
ufw allow 5349/tcp    # COTURN TLS
ufw allow 5349/udp    # COTURN TLS UDP
ufw allow 49152:65535/udp  # Media relay range
ufw --force enable

# 5. Obtener IP pública
PUBLIC_IP=$(curl -s ifconfig.me)
echo "📡 IP Pública detectada: $PUBLIC_IP"

# 6. Generar configuración COTURN
cat > /etc/turnserver.conf << EOF
# 🌐 COTURN Configuration para DigitalOcean
# IP pública: $PUBLIC_IP

# Puertos de escucha
listening-port=3478
tls-listening-port=5349

# IP Configuration
listening-ip=0.0.0.0
relay-ip=$PUBLIC_IP
external-ip=$PUBLIC_IP

# Rango de puertos para media
min-port=49152
max-port=65535

# Configuración de realm
realm=ghox.turn
server-name=ghox-turn-server

# Autenticación
lt-cred-mech
use-auth-secret
static-auth-secret=GhoxTurnSecret2024SecureKey

# Users (temporal para pruebas)
user=ghoxuser:GhoxSecurePass2024

# Logging
log-file=/var/log/turnserver/turnserver.log
verbose

# Security
fingerprint
no-multicast-peers
no-cli

# Performance
max-bps=1000000
total-quota=100
user-quota=50

# Proceso daemon
pidfile=/var/run/turnserver.pid
EOF

# 7. Crear directorio de logs
mkdir -p /var/log/turnserver
chown turnserver:turnserver /var/log/turnserver

# 8. Configurar como servicio
systemctl restart coturn
systemctl status coturn

echo "✅ COTURN configurado exitosamente!"
echo "🔗 Servidor TURN: $PUBLIC_IP:3478"
echo "🔐 Usuario: ghoxuser"
echo "🔐 Password: GhoxSecurePass2024"
echo "🔑 Secret: GhoxTurnSecret2024SecureKey"
echo ""
echo "📱 Configuración para tu app:"
echo "turn:$PUBLIC_IP:3478"
echo "turns:$PUBLIC_IP:5349"
echo ""
echo "🧪 Probar con: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/"