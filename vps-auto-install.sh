#!/bin/bash

# 🚀 Script de Instalación Automática VPS - Ghox P2P Voice Backend
# Compatible con: Ubuntu 20.04/22.04, Debian 10/11
# Tiempo estimado: 15-20 minutos
# Uso: curl -sSL https://ghox.dev/vps-complete-setup.sh | bash -s tu-dominio.com

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
DOMAIN=${1:-""}
APP_DIR="/var/www/ghox"
REPO_URL="https://github.com/iquinde/ghox_server.git"
NODE_VERSION="18"

echo -e "${BLUE}🚀 Iniciando instalación de Ghox P2P Voice Backend en VPS${NC}"
echo -e "${BLUE}===============================================${NC}"

# Función para imprimir mensajes
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que se ejecuta como root
if [[ $EUID -ne 0 ]]; then
   print_error "Este script debe ejecutarse como root"
   echo "Ejecuta: sudo $0 $@"
   exit 1
fi

# Obtener IP pública
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipecho.net/plain || curl -s icanhazip.com)
if [[ -z "$PUBLIC_IP" ]]; then
    print_error "No se pudo obtener la IP pública"
    exit 1
fi

print_status "IP pública detectada: $PUBLIC_IP"

# Paso 1: Actualizar sistema
echo -e "${BLUE}📦 Actualizando sistema...${NC}"
apt update && apt upgrade -y
print_status "Sistema actualizado"

# Paso 2: Instalar dependencias básicas
echo -e "${BLUE}🔧 Instalando dependencias básicas...${NC}"
apt install -y curl wget git ufw fail2ban nginx certbot python3-certbot-nginx unzip
print_status "Dependencias básicas instaladas"

# Paso 3: Configurar firewall
echo -e "${BLUE}🔥 Configurando firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 3000/tcp    # Node.js app
ufw allow 3478/tcp    # COTURN TCP
ufw allow 3478/udp    # COTURN UDP
ufw allow 5349/tcp    # COTURN TLS
ufw allow 5349/udp    # COTURN TLS UDP
ufw allow 49152:65535/udp  # Media relay range
ufw --force enable
print_status "Firewall configurado"

# Paso 4: Instalar Node.js
echo -e "${BLUE}📗 Instalando Node.js ${NODE_VERSION}...${NC}"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs
npm install -g pm2

NODE_VER=$(node --version)
NPM_VER=$(npm --version)
print_status "Node.js $NODE_VER y npm $NPM_VER instalados"

# Paso 5: Instalar Docker
echo -e "${BLUE}🐳 Instalando Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

DOCKER_VER=$(docker --version)
print_status "Docker instalado: $DOCKER_VER"

# Paso 6: Instalar COTURN
echo -e "${BLUE}📡 Instalando y configurando COTURN...${NC}"
apt install -y coturn

# Configurar COTURN
cat > /etc/turnserver.conf << EOF
# 🚀 Ghox COTURN Server - VPS Production Optimized
# Configuración para máximo rendimiento y compatibilidad

# Listening Configuration
listening-port=3478
tls-listening-port=5349

# IP Configuration - Auto-detect
listening-ip=0.0.0.0
relay-ip=$PUBLIC_IP
external-ip=$PUBLIC_IP

# Media relay range optimized
min-port=49152
max-port=65535

# Realm and Server
realm=ghox-prod.turn
server-name="Ghox Production TURN Server"

# Authentication - Long-term credentials
lt-cred-mech
use-auth-secret
static-auth-secret=GhoxTurnProductionSecret2024VPS$(date +%s)

# Production Users
user=ghoxuser:GhoxSecure2024VPS
user=ghoxadmin:GhoxAdminSecure2024VPS

# Security & Performance
fingerprint
no-multicast-peers
no-cli
no-loopback-peers
stun-only=false

# Performance tuning
max-bps=2000000
total-quota=100
user-quota=50
bps-capacity=0
max-allocate-lifetime=3600
channel-lifetime=600
permission-lifetime=300

# Logging
verbose
log-file=/var/log/turnserver/turnserver.log
simple-log

# Process management
pidfile=/var/run/turnserver.pid
prod
EOF

# Crear directorio de logs
mkdir -p /var/log/turnserver
chown turnserver:turnserver /var/log/turnserver

# Habilitar COTURN
systemctl enable coturn
systemctl restart coturn

print_status "COTURN configurado en puertos 3478, 5349"

# Paso 7: Clonar proyecto
echo -e "${BLUE}📥 Clonando proyecto Ghox...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

if [[ -d ".git" ]]; then
    git pull origin main
else
    git clone $REPO_URL .
fi

# Instalar dependencias
npm install
print_status "Proyecto clonado e instalado"

# Paso 8: Configurar variables de entorno
echo -e "${BLUE}⚙️  Configurando variables de entorno...${NC}"
cat > .env << EOF
# 🚀 Ghox P2P Voice Backend - VPS Production
NODE_ENV=production
PORT=3000

# 📊 MongoDB Atlas (usar tu cluster)
MONGO_URI=mongodb+srv://Ghox_db:AdminGhox01@cluster0.1v2iivg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# 🔐 JWT
JWT_SECRET=GhoxVPSSecretKey2024

# 🏠 COTURN VPS Configuration
COTURN_URL=$PUBLIC_IP
COTURN_USERNAME=ghoxuser
COTURN_PASSWORD=GhoxSecurePass2024VPS
COTURN_SECRET=GhoxTurnSecretVPS2024

# 💙 Twilio (backup) - Agregar tus credenciales
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# 🚀 Redis (local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 🔒 SSL Configuration
USE_SSL=true
SSL_CERT_PATH=/etc/letsencrypt/live/$DOMAIN/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/$DOMAIN/privkey.pem
EOF

print_status "Variables de entorno configuradas"

# Paso 9: Configurar PM2
echo -e "${BLUE}🔄 Configurando PM2...${NC}"
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ghox-voice-backend',
    script: 'src/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    restart_delay: 4000,
    max_memory_restart: '500M'
  }]
};
EOF

mkdir -p logs
print_status "PM2 configurado"

# Paso 10: Configurar Nginx
echo -e "${BLUE}🌐 Configurando Nginx...${NC}"
cat > /etc/nginx/sites-available/ghox << EOF
server {
    listen 80;
    server_name $DOMAIN $PUBLIC_IP;
    
    # Redirigir HTTP a HTTPS si hay dominio
    if (\$host = $DOMAIN) {
        return 301 https://\$server_name\$request_uri;
    }

    # API directo por IP
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# Si hay dominio, crear configuración HTTPS
if [[ ! -z "$DOMAIN" ]]; then
cat >> /etc/nginx/sites-available/ghox << EOF

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL será configurado por Certbot
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
fi

# Habilitar sitio
ln -sf /etc/nginx/sites-available/ghox /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

print_status "Nginx configurado"

# Paso 11: SSL con Let's Encrypt (si hay dominio)
if [[ ! -z "$DOMAIN" ]]; then
    echo -e "${BLUE}🔒 Configurando SSL con Let's Encrypt...${NC}"
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect
    
    # Configurar renovación automática
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    print_status "SSL configurado para $DOMAIN"
else
    print_warning "Sin dominio especificado, SSL no configurado"
    print_warning "Para configurar SSL después: certbot --nginx -d tu-dominio.com"
fi

# Paso 12: Iniciar aplicación
echo -e "${BLUE}🚀 Iniciando aplicación...${NC}"
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

print_status "Aplicación iniciada con PM2"

# Paso 13: Configurar Redis local (opcional)
echo -e "${BLUE}💾 Instalando Redis local...${NC}"
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server
print_status "Redis instalado y funcionando"

# Verificaciones finales
echo -e "${BLUE}🧪 Verificando instalación...${NC}"

# Test servicios
if systemctl is-active --quiet coturn; then
    print_status "COTURN funcionando"
else
    print_warning "COTURN no está funcionando"
fi

if systemctl is-active --quiet nginx; then
    print_status "Nginx funcionando"
else
    print_warning "Nginx no está funcionando"
fi

if systemctl is-active --quiet redis-server; then
    print_status "Redis funcionando"
else
    print_warning "Redis no está funcionando"
fi

# Mostrar información final
echo -e "${GREEN}🎉 ¡Instalación completada!${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "🌐 ${YELLOW}Acceso público:${NC}"
if [[ ! -z "$DOMAIN" ]]; then
    echo -e "   📱 App: https://$DOMAIN"
    echo -e "   🔗 API: https://$DOMAIN/api/ice"
else
    echo -e "   📱 App: http://$PUBLIC_IP:3000"
    echo -e "   🔗 API: http://$PUBLIC_IP:3000/api/ice"
fi

echo -e "\n📡 ${YELLOW}COTURN Server:${NC}"
echo -e "   🔗 STUN: stun:$PUBLIC_IP:3478"
echo -e "   🔗 TURN: turn:$PUBLIC_IP:3478"
echo -e "   👤 User: ghoxuser"
echo -e "   🔑 Pass: GhoxSecurePass2024VPS"

echo -e "\n🔧 ${YELLOW}Comandos útiles:${NC}"
echo -e "   pm2 status                    # Ver estado de la app"
echo -e "   pm2 logs ghox-voice-backend  # Ver logs"
echo -e "   pm2 restart ghox-voice-backend # Reiniciar app"
echo -e "   systemctl status coturn       # Estado COTURN"
echo -e "   systemctl status nginx        # Estado Nginx"

echo -e "\n🧪 ${YELLOW}Probar conectividad:${NC}"
echo -e "   https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/"

echo -e "\n💡 ${YELLOW}Próximos pasos:${NC}"
echo -e "   1. Configurar DNS para apuntar $DOMAIN a $PUBLIC_IP"
echo -e "   2. Agregar credenciales Twilio en .env"
echo -e "   3. Probar llamadas desde diferentes redes"

print_status "¡Backend P2P Voice listo para producción!"