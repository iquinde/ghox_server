# 🚀 Despliegue VPS - Backend P2P con COTURN

## 🎯 Opciones de VPS Recomendadas

### 1. **DigitalOcean** (Más popular)
- **Droplet Basic**: $6/mes (1GB RAM, 25GB SSD, 1TB transfer)
- **Droplet Standard**: $12/mes (2GB RAM, 50GB SSD) 
- **Regiones**: NYC, AMS, SGP, BLR (elige la más cercana)
- **Ventajas**: Interface fácil, buena documentación

### 2. **Vultr** (Mejor precio/performance)
- **Regular**: $5/mes (1GB RAM, 25GB SSD)
- **High Performance**: $6/mes (1GB RAM, NVMe SSD)
- **Regiones**: Muchas opciones globales

### 3. **Linode** (Muy confiable)
- **Nanode**: $5/mes (1GB RAM, 25GB SSD)
- **Shared CPU**: $10/mes (2GB RAM, 50GB SSD)

### 4. **AWS Lightsail** (Si ya usas AWS)
- **$5/mes**: 1GB RAM, 40GB SSD
- **$10/mes**: 2GB RAM, 60GB SSD

---

## 🔧 Setup Completo en VPS (20 minutos)

### Paso 1: Crear VPS
```bash
# Especificaciones mínimas recomendadas:
OS: Ubuntu 22.04 LTS
RAM: 1GB (mínimo), 2GB (recomendado)
Storage: 25GB SSD
Network: 1TB transfer
```

### Paso 2: Configuración Inicial
```bash
# SSH al servidor
ssh root@TU_IP_VPS

# Actualizar sistema
apt update && apt upgrade -y

# Instalar dependencias básicas
apt install -y curl wget git ufw fail2ban

# Configurar firewall básico
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
```

### Paso 3: Instalar Node.js y Docker
```bash
# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar versión
node --version && npm --version

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version && docker-compose --version
```

### Paso 4: Clonar y Configurar Proyecto
```bash
# Clonar tu repositorio
git clone https://github.com/iquinde/ghox_server.git
cd ghox_server

# Instalar dependencias
npm install

# Configurar variables de entorno para VPS
cp .env.example .env
```

### Paso 5: Configurar .env para VPS
```bash
# Editar archivo de configuración
nano .env

# Configuración VPS:
NODE_ENV=production
PORT=3000

# MongoDB (usar tu Atlas cluster)
MONGO_URI=mongodb+srv://Ghox_db:AdminGhox01@cluster0.1v2iivg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# COTURN Local (se instalará en mismo VPS)
COTURN_URL=TU_IP_VPS_AQUI
COTURN_USERNAME=ghoxuser
COTURN_PASSWORD=GhoxSecurePass2024VPS
COTURN_SECRET=GhoxTurnSecretVPS2024

# SSL (se configurará después)
USE_SSL=true
SSL_CERT_PATH=/etc/ssl/certs/ghox.crt
SSL_KEY_PATH=/etc/ssl/private/ghox.key

# Twilio (backup)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
```

### Paso 6: Instalar COTURN en VPS
```bash
# Instalar COTURN
apt install coturn -y

# Obtener IP pública del VPS
PUBLIC_IP=$(curl -s ifconfig.me)
echo "IP pública VPS: $PUBLIC_IP"

# Configurar COTURN para VPS
cat > /etc/turnserver.conf << EOF
# COTURN para Ghox P2P Voice - VPS Production
listening-port=3478
tls-listening-port=5349

# IP Configuration
listening-ip=0.0.0.0
relay-ip=$PUBLIC_IP
external-ip=$PUBLIC_IP

# Media relay range
min-port=49152
max-port=65535

# Realm
realm=ghox-vps.turn
server-name="Ghox VPS TURN Server"

# Authentication
lt-cred-mech
use-auth-secret
static-auth-secret=GhoxTurnSecretVPS2024

# Users
user=ghoxuser:GhoxSecurePass2024VPS

# Security & Performance
fingerprint
no-multicast-peers
no-cli
max-bps=1000000
verbose
log-file=/var/log/turnserver/turnserver.log
pidfile=/var/run/turnserver.pid
EOF

# Crear directorio logs
mkdir -p /var/log/turnserver
chown turnserver:turnserver /var/log/turnserver

# Habilitar y iniciar COTURN
systemctl enable coturn
systemctl restart coturn
systemctl status coturn
```

### Paso 7: Configurar SSL con Let's Encrypt
```bash
# Instalar Certbot
apt install -y certbot

# Si tienes dominio (recomendado):
certbot certonly --standalone -d tu-dominio.com -d api.tu-dominio.com

# Configurar renovación automática
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### Paso 8: Configurar PM2 para Process Management
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Configurar aplicación
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ghox-voice-backend',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
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
    time: true
  }]
};
EOF

# Crear directorio logs
mkdir -p logs

# Iniciar aplicación con PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Paso 9: Configurar Nginx como Proxy Reverso
```bash
# Instalar Nginx
apt install -y nginx

# Configurar virtual host
cat > /etc/nginx/sites-available/ghox << EOF
server {
    listen 80;
    server_name TU_DOMINIO_O_IP;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name TU_DOMINIO_O_IP;

    # SSL Configuration (si tienes certificados)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    
    # Proxy to Node.js
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

# Habilitar sitio
ln -s /etc/nginx/sites-available/ghox /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

---

## 🧪 Verificar Instalación

### Test 1: Verificar servicios
```bash
# Ver estado de servicios
systemctl status coturn
systemctl status nginx
pm2 status

# Test COTURN
turnutils_uclient -T -u ghoxuser -w GhoxSecurePass2024VPS $PUBLIC_IP

# Test API
curl https://TU_DOMINIO/api/ice
```

### Test 2: Verificar conectividad WebRTC
1. **Ir a**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
2. **Configurar**:
   ```
   STUN URI: stun:TU_IP_VPS:3478
   TURN URI: turn:TU_IP_VPS:3478
   Username: ghoxuser
   Password: GhoxSecurePass2024VPS
   ```

---

## 💰 Costos Estimados Mensuales

- **VPS Basic**: $5-6/mes
- **Dominio** (opcional): $12/año
- **SSL**: Gratis (Let's Encrypt)
- **Total**: ~$6/mes

---

## 🚀 Script de Instalación Automática

```bash
# Crear script de instalación completa
curl -O https://ghox.dev/vps-setup.sh
chmod +x vps-setup.sh
./vps-setup.sh TU_DOMINIO.com
```

**¿Qué VPS prefieres usar?** ¿DigitalOcean, Vultr, o tienes otra preferencia?