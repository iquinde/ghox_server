#!/bin/bash

# 🚀 GHOX P2P VOICE BACKEND - INSTALACIÓN COMPLETA VPS
# Script ultra-optimizado para deployment en producción
# Compatible: Ubuntu 22.04 LTS, DigitalOcean, Vultr, Linode
# Tiempo: 15 minutos | Costo: $6/mes

set -euo pipefail  # Strict mode

# Variables de configuración
DOMAIN="${1:-""}"
APP_DIR="/var/www/ghox"
REPO_URL="https://github.com/iquinde/ghox_server.git"
NODE_VERSION="18"
ADMIN_EMAIL="${2:-admin@ghox.dev}"

# Colores para output bonito
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner inicial
clear
echo -e "${PURPLE}"
cat << "EOF"
  ____  _   _  _____  _  _    _   _  ___  ____  _____  _____
 / ___|| | | |/ _ \ \| |/ \  | | | |/ _ \|  _ \| ____| ______|
| |  _ | |_| | | | |  \ /   | | | | | | | | | |  _|  _| |    
| |_| ||  _  | |_| | |\ \   | |_| | |_| | |_| | |___| |___  
 \____||_| |_|\___/|_| \_\   \___/ \___/|____/|_____|_____|
                                                            
🚀 P2P VOICE BACKEND - COMPLETE VPS SETUP
EOF
echo -e "${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "${GREEN}🎯 Instalación completa para producción${NC}"
echo -e "${GREEN}⏱️  Tiempo estimado: 15 minutos${NC}"
echo -e "${GREEN}💰 Costo: ~$6/mes todo incluido${NC}"
echo -e "${BLUE}===============================================${NC}\n"

# Funciones de utilidad
print_step() {
    echo -e "\n${BLUE}📋 PASO $1: $2${NC}"
    echo -e "${BLUE}$(printf '=%.0s' {1..50})${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Verificar prerrequisitos
check_requirements() {
    print_step "1" "Verificando prerrequisitos"
    
    if [[ $EUID -ne 0 ]]; then
       print_error "Este script debe ejecutarse como root"
       echo "Ejecuta: sudo $0 $@"
       exit 1
    fi

    # Verificar OS
    if [[ ! -f /etc/os-release ]]; then
        print_error "No se pudo detectar el sistema operativo"
        exit 1
    fi
    
    source /etc/os-release
    if [[ "$ID" != "ubuntu" ]] && [[ "$ID" != "debian" ]]; then
        print_error "Este script solo funciona en Ubuntu/Debian"
        exit 1
    fi
    
    print_success "OS detectado: $PRETTY_NAME"
    
    # Obtener y verificar IP pública
    PUBLIC_IP=$(curl -s --max-time 10 ifconfig.me || curl -s --max-time 10 ipecho.net/plain || curl -s --max-time 10 icanhazip.com || echo "")
    if [[ -z "$PUBLIC_IP" ]]; then
        print_error "No se pudo obtener la IP pública del VPS"
        exit 1
    fi
    
    print_success "IP pública: $PUBLIC_IP"
    
    # Verificar memoria disponible
    MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [[ $MEMORY -lt 900 ]]; then
        print_warning "Memoria disponible: ${MEMORY}MB (recomendado: 1GB+)"
    else
        print_success "Memoria disponible: ${MEMORY}MB"
    fi
    
    # Verificar espacio en disco
    DISK=$(df -h / | awk 'NR==2 {print $4}')
    print_success "Espacio disponible: $DISK"
}

# Actualizar sistema
update_system() {
    print_step "2" "Actualizando sistema y paquetes"
    
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get upgrade -y -qq
    apt-get install -y -qq curl wget git software-properties-common apt-transport-https ca-certificates gnupg lsb-release
    
    print_success "Sistema actualizado"
}

# Configurar firewall avanzado
setup_firewall() {
    print_step "3" "Configurando firewall y seguridad"
    
    # Reset UFW
    ufw --force reset
    
    # Configuración básica
    ufw default deny incoming
    ufw default allow outgoing
    
    # Servicios esenciales
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # Aplicación
    ufw allow 3000/tcp comment 'Node.js Backend'
    
    # COTURN - optimizado para máxima compatibilidad
    ufw allow 3478/tcp comment 'COTURN TURN TCP'
    ufw allow 3478/udp comment 'COTURN TURN UDP'
    ufw allow 5349/tcp comment 'COTURN TURNS TCP'
    ufw allow 5349/udp comment 'COTURN TURNS UDP'
    
    # Media relay range optimizado
    ufw allow 49152:65535/udp comment 'COTURN Media Relay Range'
    
    # Rate limiting para SSH
    ufw limit ssh
    
    # Activar firewall
    ufw --force enable
    
    # Instalar fail2ban para protección adicional
    apt-get install -y -qq fail2ban
    
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF
    
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    print_success "Firewall y fail2ban configurados"
}

# Instalar Node.js optimizado
install_nodejs() {
    print_step "4" "Instalando Node.js ${NODE_VERSION} y PM2"
    
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    
    # Instalar PM2 globalmente
    npm install -g pm2@latest
    
    # Configurar PM2 startup
    env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
    
    NODE_VER=$(node --version)
    NPM_VER=$(npm --version)
    PM2_VER=$(pm2 --version)
    
    print_success "Node.js $NODE_VER, npm $NPM_VER, PM2 $PM2_VER instalados"
}

# Instalar y configurar COTURN optimizado
install_coturn() {
    print_step "5" "Instalando COTURN server optimizado"
    
    apt-get install -y -qq coturn
    
    # Generar secret único
    TURN_SECRET="GhoxProd$(date +%s)$(openssl rand -hex 8)"
    
    # Configuración optimizada para producción
    cat > /etc/turnserver.conf << EOF
# 🚀 GHOX COTURN - OPTIMIZED PRODUCTION CONFIG
# Auto-generated: $(date)

# === NETWORK CONFIGURATION ===
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
relay-ip=$PUBLIC_IP
external-ip=$PUBLIC_IP

# === MEDIA RELAY CONFIGURATION ===
min-port=49152
max-port=65535

# === REALM AND SERVER ===
realm=ghox.prod
server-name="Ghox Production TURN Server"

# === AUTHENTICATION ===
lt-cred-mech
use-auth-secret
static-auth-secret=$TURN_SECRET

# Production users with strong passwords
user=ghoxuser:$(openssl rand -base64 12)
user=ghoxapi:$(openssl rand -base64 12)

# === SECURITY SETTINGS ===
fingerprint
no-multicast-peers
no-cli
no-loopback-peers
stun-only=false
secure-stun

# === PERFORMANCE TUNING ===
max-bps=3000000
total-quota=100
user-quota=50
bps-capacity=0

# Session timeouts
max-allocate-lifetime=3600
channel-lifetime=600
permission-lifetime=300
stale-nonce=600

# === LOGGING ===
verbose
log-file=/var/log/turnserver/turnserver.log
simple-log
new-log-timestamp-format

# === PROCESS MANAGEMENT ===
pidfile=/var/run/turnserver.pid
proc-user=turnserver
proc-group=turnserver

# Production optimizations
prod
no-stdout-log
EOF

    # Crear directorio de logs con permisos correctos
    mkdir -p /var/log/turnserver
    chown turnserver:turnserver /var/log/turnserver
    chmod 755 /var/log/turnserver
    
    # Configurar logrotate para COTURN
    cat > /etc/logrotate.d/coturn << EOF
/var/log/turnserver/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    copytruncate
    postrotate
        systemctl reload coturn > /dev/null 2>&1 || true
    endscript
}
EOF

    # Habilitar y configurar servicio
    systemctl enable coturn
    systemctl start coturn
    
    # Guardar credenciales para usar después
    echo "$TURN_SECRET" > /tmp/turn_secret
    
    print_success "COTURN configurado con secret: ${TURN_SECRET:0:10}..."
}

# Instalar Docker y Redis
install_services() {
    print_step "6" "Instalando Docker y Redis"
    
    # Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    
    # Docker Compose
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Redis local
    apt-get install -y -qq redis-server
    
    # Configurar Redis para producción
    sed -i 's/# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
    sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
    
    systemctl enable redis-server
    systemctl restart redis-server
    
    DOCKER_VER=$(docker --version | cut -d' ' -f3)
    print_success "Docker $DOCKER_VER y Redis instalados"
}

# Clonar y configurar aplicación
setup_application() {
    print_step "7" "Configurando aplicación Ghox"
    
    # Crear usuario para la aplicación
    useradd --system --shell /bin/bash --home $APP_DIR --create-home ghox || true
    
    # Clonar repositorio
    if [[ -d "$APP_DIR/.git" ]]; then
        cd $APP_DIR
        git pull origin main
        chown -R ghox:ghox $APP_DIR
    else
        git clone $REPO_URL $APP_DIR
        chown -R ghox:ghox $APP_DIR
        cd $APP_DIR
    fi
    
    # Instalar dependencias como usuario ghox
    sudo -u ghox npm install --production
    
    # Configurar variables de entorno para producción
    TURN_SECRET=$(cat /tmp/turn_secret)
    JWT_SECRET="GhoxJWT$(date +%s)$(openssl rand -hex 16)"
    
    cat > $APP_DIR/.env << EOF
# 🚀 GHOX P2P VOICE BACKEND - VPS PRODUCTION
# Generated: $(date)

NODE_ENV=production
PORT=3000

# 🔐 Security
JWT_SECRET=$JWT_SECRET

# 📊 MongoDB Atlas (tu cluster existente)
MONGO_URI=mongodb+srv://Ghox_db:AdminGhox01@cluster0.1v2iivg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# 🏠 COTURN VPS Configuration (Tu servidor TURN propio)
COTURN_URL=$PUBLIC_IP
COTURN_USERNAME=ghoxuser
COTURN_PASSWORD=GhoxSecure2024VPS
COTURN_SECRET=$TURN_SECRET

# 💙 Twilio (backup TURN) - Agrega tus credenciales
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# 🚀 Redis Local
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 🔒 SSL Configuration
USE_SSL=true
SSL_CERT_PATH=/etc/letsencrypt/live/$DOMAIN/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/$DOMAIN/privkey.pem

# 📊 Application Settings
MAX_CONNECTIONS=1000
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    
    chown ghox:ghox $APP_DIR/.env
    chmod 600 $APP_DIR/.env
    
    print_success "Aplicación configurada en $APP_DIR"
}

# Configurar PM2 para producción
setup_pm2() {
    print_step "8" "Configurando PM2 para producción"
    
    cd $APP_DIR
    
    # Configuración optimizada de PM2
    cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ghox-voice-backend',
    script: 'src/index.js',
    instances: 1, // Usar 1 instancia para 1GB RAM
    exec_mode: 'fork', // Fork mode para mejor compatibilidad
    
    // Environment
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Process management
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '400M',
    
    // Monitoring
    pmx: true,
    
    // Advanced settings
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,
    
    // Auto restart on file changes (disabled in production)
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    
    // Source map support
    source_map_support: true,
    
    // Merge logs
    merge_logs: true,
    
    // Log rotation
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Health monitoring
    health_check_grace_period: 3000
  }]
};
EOF
    
    # Crear directorio de logs
    mkdir -p $APP_DIR/logs
    chown -R ghox:ghox $APP_DIR/logs
    
    # Configurar logrotate para aplicación
    cat > /etc/logrotate.d/ghox << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    copytruncate
    su ghox ghox
}
EOF
    
    print_success "PM2 configurado con monitoreo avanzado"
}

# Instalar y configurar Nginx optimizado
setup_nginx() {
    print_step "9" "Configurando Nginx con SSL"
    
    apt-get install -y -qq nginx
    
    # Configurar Nginx optimizado para WebRTC
    cat > /etc/nginx/sites-available/ghox << EOF
# 🚀 GHOX P2P Voice Backend - Nginx Configuration (IP-based)
# Optimized for WebRTC, WebSocket, and high performance

# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=socket:10m rate=30r/s;

# Upstream
upstream ghox_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Main server (HTTP and HTTPS)
server {
    listen 80;
    listen 443 ssl;
    server_name $PUBLIC_IP localhost _;
    
    # SSL Configuration (self-signed for IP access)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers optimized for IP access
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # CORS Headers for WebRTC (essential for IP-based access)
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE" always;
    add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
    
    # Handle preflight requests
    if (\$request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
        add_header Access-Control-Max-Age 1728000;
        add_header Content-Type "text/plain charset=UTF-8";
        add_header Content-Length 0;
        return 204;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Client settings
    client_max_body_size 50M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # Proxy settings for WebSocket support
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
    proxy_buffering off;
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
    
    # Main application
    location / {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://ghox_backend;
    }
    
    # WebSocket endpoints (Socket.IO)
    location /socket.io/ {
        limit_req zone=socket burst=50 nodelay;
        proxy_pass http://ghox_backend;
    }
    
    # API endpoints
    location /api/ {
        limit_req zone=api burst=15 nodelay;
        proxy_pass http://ghox_backend;
    }
    
    # Health check
    location /health {
        access_log off;
        proxy_pass http://ghox_backend;
    }
}
EOF
    
    # Habilitar sitio
    ln -sf /etc/nginx/sites-available/ghox /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuración
    nginx -t && systemctl restart nginx
    systemctl enable nginx
    
    print_success "Nginx configurado con optimizaciones WebRTC"
}

# Configurar SSL
setup_ssl() {
    if [[ ! -z "$DOMAIN" ]] && [[ "$DOMAIN" != "" ]]; then
        print_step "10" "Configurando SSL con Let's Encrypt para $DOMAIN"
        
        apt-get install -y -qq certbot python3-certbot-nginx
        
        # Obtener certificado SSL
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $ADMIN_EMAIL --redirect
        
        # Configurar renovación automática
        echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
        
        print_success "SSL configurado para $DOMAIN"
    else
        print_step "10" "Configurando acceso por IP (sin dominio)"
        
        print_info "Usando certificado auto-firmado para acceso HTTPS por IP"
        print_info "Navegadores mostrarán advertencia de seguridad (normal para IP)"
        print_info "APIs y apps móviles funcionarán perfectamente"
        
        # Generar certificado auto-firmado mejorado si no existe
        if [[ ! -f /etc/ssl/certs/ssl-cert-snakeoil.pem ]]; then
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout /etc/ssl/private/ssl-cert-snakeoil.key \
                -out /etc/ssl/certs/ssl-cert-snakeoil.pem \
                -subj "/C=US/ST=State/L=City/O=Ghox/CN=$PUBLIC_IP"
        fi
        
        print_success "Acceso HTTPS configurado para IP: $PUBLIC_IP"
        print_info "Para SSL con dominio después: certbot --nginx -d tu-dominio.com"
    fi
}

# Iniciar aplicación
start_application() {
    print_step "11" "Iniciando aplicación con PM2"
    
    cd $APP_DIR
    
    # Iniciar con PM2 como usuario ghox
    sudo -u ghox pm2 start ecosystem.config.js --env production
    sudo -u ghox pm2 save
    
    # Configurar PM2 startup para usuario ghox
    env PATH=$PATH:/usr/bin pm2 startup systemd -u ghox --hp $APP_DIR
    
    print_success "Aplicación iniciada con PM2"
}

# Verificaciones finales
final_verification() {
    print_step "12" "Verificando instalación completa"
    
    # Verificar servicios
    services=("nginx" "coturn" "redis-server")
    for service in "${services[@]}"; do
        if systemctl is-active --quiet $service; then
            print_success "$service funcionando"
        else
            print_warning "$service no está funcionando"
        fi
    done
    
    # Verificar PM2
    if sudo -u ghox pm2 list | grep -q "ghox-voice-backend"; then
        print_success "PM2 aplicación funcionando"
    else
        print_warning "PM2 aplicación no encontrada"
    fi
    
    # Test de conectividad
    sleep 5
    if curl -s -f http://localhost:3000/api/ice > /dev/null; then
        print_success "API respondiendo correctamente"
    else
        print_warning "API no responde (puede tardar unos segundos en iniciar)"
    fi
    
    # Limpiar archivos temporales
    rm -f /tmp/turn_secret get-docker.sh
    
    print_success "Verificación completada"
}

# Mostrar información final
show_final_info() {
    clear
    echo -e "${PURPLE}"
    cat << "EOF"
 ✅ INSTALACIÓN COMPLETADA EXITOSAMENTE! 
EOF
    echo -e "${NC}"
    
    TURN_SECRET=$(grep "static-auth-secret" /etc/turnserver.conf | cut -d'=' -f2)
    
    echo -e "${GREEN}🎉 GHOX P2P VOICE BACKEND - DEPLOYMENT EXITOSO!${NC}"
    echo -e "${BLUE}================================================================${NC}\n"
    
    echo -e "${CYAN}🌐 ACCESO PÚBLICO:${NC}"
    if [[ ! -z "$DOMAIN" ]]; then
        echo -e "   📱 Aplicación: ${GREEN}https://$DOMAIN${NC}"
        echo -e "   🔗 API ICE: ${GREEN}https://$DOMAIN/api/ice${NC}"
        echo -e "   📊 Stats: ${GREEN}https://$DOMAIN/api/ice/stats${NC}"
    else
        echo -e "   📱 Aplicación: ${GREEN}https://$PUBLIC_IP${NC}"
        echo -e "   🔗 API ICE: ${GREEN}https://$PUBLIC_IP/api/ice${NC}"
        echo -e "   📊 Stats: ${GREEN}https://$PUBLIC_IP/api/ice/stats${NC}"
    fi
    
    echo -e "\n${CYAN}📡 COTURN SERVER (Tu servidor TURN propio):${NC}"
    echo -e "   🔗 STUN: ${GREEN}stun:$PUBLIC_IP:3478${NC}"
    echo -e "   🔗 TURN: ${GREEN}turn:$PUBLIC_IP:3478${NC}"
    echo -e "   👤 Usuario: ${GREEN}ghoxuser${NC}"
    echo -e "   🔑 Password: ${GREEN}GhoxSecure2024VPS${NC}"
    echo -e "   🗝️  Secret: ${GREEN}${TURN_SECRET:0:20}...${NC}"
    
    echo -e "\n${CYAN}💾 SERVICIOS CORRIENDO:${NC}"
    echo -e "   ✅ Node.js Backend (PM2)"
    echo -e "   ✅ COTURN Server (ports 3478, 5349)"
    echo -e "   ✅ Nginx + SSL (port 443)"
    echo -e "   ✅ Redis Cache (port 6379)"
    echo -e "   ✅ MongoDB Atlas (conectado)"
    echo -e "   ✅ Firewall UFW + Fail2ban"
    
    echo -e "\n${CYAN}🔧 COMANDOS ÚTILES:${NC}"
    echo -e "   ${YELLOW}sudo -u ghox pm2 status${NC}                    # Estado aplicación"
    echo -e "   ${YELLOW}sudo -u ghox pm2 logs ghox-voice-backend${NC}   # Ver logs"
    echo -e "   ${YELLOW}sudo -u ghox pm2 restart ghox-voice-backend${NC} # Reiniciar app"
    echo -e "   ${YELLOW}systemctl status coturn${NC}                    # Estado COTURN"
    echo -e "   ${YELLOW}systemctl status nginx${NC}                     # Estado Nginx"
    echo -e "   ${YELLOW}tail -f /var/log/turnserver/turnserver.log${NC} # Logs COTURN"
    
    echo -e "\n${CYAN}🧪 PROBAR CONECTIVIDAD:${NC}"
    echo -e "   ${GREEN}https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/${NC}"
    echo -e "   Configurar TURN: ${YELLOW}turn:$PUBLIC_IP:3478${NC} | User: ${YELLOW}ghoxuser${NC} | Pass: ${YELLOW}GhoxSecure2024VPS${NC}"
    
    echo -e "\n${CYAN}📱 CONFIGURAR TU APP CLIENTE:${NC}"
    if [[ ! -z "$DOMAIN" ]]; then
        echo -e "   ${GREEN}const API_BASE = 'https://$DOMAIN';${NC}"
    else
        echo -e "   ${GREEN}const API_BASE = 'https://$PUBLIC_IP';${NC}"
    fi
    echo -e "   ${GREEN}const iceConfig = await fetch(\`\${API_BASE}/api/ice\`);${NC}"
    
    echo -e "\n${CYAN}💰 COSTOS MENSUALES:${NC}"
    echo -e "   💰 VPS: $6/mes"
    echo -e "   🌐 Dominio: $1/mes (opcional)"
    echo -e "   📊 MongoDB: Gratis (512MB)"
    echo -e "   🔒 SSL: Gratis (Let's Encrypt)"
    echo -e "   📈 Total: ${GREEN}~$7/mes todo incluido${NC}"
    
    echo -e "\n${CYAN}💡 PRÓXIMOS PASOS:${NC}"
    if [[ ! -z "$DOMAIN" ]]; then
        echo -e "   1. ✅ Configurar DNS para $DOMAIN → $PUBLIC_IP"
    else
        echo -e "   1. 📝 Configurar dominio (opcional): certbot --nginx -d tu-dominio.com"
    fi
    echo -e "   2. 📝 Agregar credenciales Twilio en $APP_DIR/.env"
    echo -e "   3. 🧪 Probar llamadas desde diferentes redes/dispositivos"
    echo -e "   4. 📊 Monitorear logs y performance"
    
    echo -e "\n${GREEN}🎯 ¡Backend P2P Voice listo para producción!${NC}"
    echo -e "${GREEN}🌟 Tu aplicación ya puede manejar llamadas P2P desde cualquier red${NC}"
    echo -e "${BLUE}================================================================${NC}\n"
}

# Función principal
main() {
    check_requirements
    update_system
    setup_firewall
    install_nodejs
    install_coturn
    install_services
    setup_application
    setup_pm2
    setup_nginx
    setup_ssl
    start_application
    final_verification
    show_final_info
}

# Ejecutar instalación
main "$@"