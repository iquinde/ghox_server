# 🚀 Configuración Express para COTURN en DigitalOcean

## Paso 1: Crear Droplet (2 minutos)

### Via DigitalOcean Dashboard:
1. **Login**: https://cloud.digitalocean.com
2. **Create → Droplets**
3. **Configuración Rápida**:
   ```
   Image: Ubuntu 22.04 LTS
   Plan: Basic $6/mes (1GB RAM, 25GB SSD)
   Datacenter: NYC3 o AMS3 (más cercano a tus usuarios)
   Authentication: SSH Key (recomendado)
   Hostname: ghox-coturn-server
   ```

### Via CLI (alternativo):
```bash
# Instalar doctl CLI
# Crear droplet
doctl compute droplet create ghox-coturn \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --region nyc3 \
  --ssh-keys TU_SSH_KEY_ID
```

## Paso 2: Configuración Automática (5 minutos)

### Conectar y configurar:
```bash
# SSH al servidor
ssh root@TU_IP_PUBLICA

# Ejecutar setup completo
curl -sSL https://ghox.dev/coturn-setup.sh | bash
```

### O configuración manual:
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar COTURN
apt install coturn -y

# Obtener IP pública
PUBLIC_IP=$(curl -s ifconfig.me)

# Configurar COTURN
cat > /etc/turnserver.conf << 'EOF'
# 🌐 Ghox COTURN Server - DigitalOcean Production
listening-port=3478
tls-listening-port=5349

# IPs
listening-ip=0.0.0.0
relay-ip=IP_PUBLICA_AQUI
external-ip=IP_PUBLICA_AQUI

# Media ports
min-port=49152
max-port=65535

# Auth
realm=ghox.turn
lt-cred-mech
use-auth-secret
static-auth-secret=GhoxTurnSecret2024SecureKey

# Users
user=ghoxuser:GhoxSecurePass2024

# Security
fingerprint
no-multicast-peers
no-cli

# Performance
max-bps=1000000
verbose
log-file=/var/log/turnserver/turnserver.log
EOF

# Reemplazar IP
sed -i "s/IP_PUBLICA_AQUI/$PUBLIC_IP/g" /etc/turnserver.conf

# Configurar firewall
ufw allow 22/tcp
ufw allow 3478/tcp
ufw allow 3478/udp
ufw allow 5349/tcp  
ufw allow 5349/udp
ufw allow 49152:65535/udp
ufw --force enable

# Crear directorio logs
mkdir -p /var/log/turnserver
chown turnserver:turnserver /var/log/turnserver

# Iniciar servicio
systemctl enable coturn
systemctl restart coturn

echo "✅ COTURN configurado en: $PUBLIC_IP"
```

## Paso 3: Actualizar tu Backend (1 minuto)

### Editar .env:
```bash
# Comentar configuración local
# COTURN_URL=localhost

# Activar configuración de producción
COTURN_URL=TU_IP_DIGITALOCEAN
COTURN_USERNAME=ghoxuser
COTURN_PASSWORD=GhoxSecurePass2024
COTURN_SECRET=GhoxTurnSecret2024SecureKey
```

### Probar configuración:
```bash
npm start
# Probar: http://localhost:3000/api/ice
# Debería mostrar tu servidor DigitalOcean
```

## Paso 4: Verificar Funcionamiento

### Test WebRTC:
1. **Ir a**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
2. **Configurar**:
   ```
   STUN URI: stun:TU_IP:3478
   TURN URI: turn:TU_IP:3478
   Username: ghoxuser
   Password: GhoxSecurePass2024
   ```
3. **Hacer clic**: "Add server" → "Gather candidates"
4. **Verificar**: Debe mostrar candidatos TURN exitosos

### Test desde diferentes redes:
- ✅ WiFi casa  
- ✅ Datos móviles 4G/5G
- ✅ WiFi corporativo
- ✅ Diferentes países

## 💰 Costos

- **DigitalOcean**: $6/mes ($0.009/hora)
- **Bandwidth**: 1TB incluido (suficiente para muchas llamadas)
- **Total mensual**: ~$6 USD

## 🔧 Comandos Útiles

### Verificar estado:
```bash
# Estado del servicio
systemctl status coturn

# Ver logs en tiempo real  
tail -f /var/log/turnserver/turnserver.log

# Probar puerto
telnet TU_IP 3478

# Ver estadísticas
turnutils_uclient -T -u ghoxuser -w GhoxSecurePass2024 TU_IP
```

### Reiniciar si es necesario:
```bash
systemctl restart coturn
```

---

## 🎯 ¿Listo para configurar?

**Opción 1**: Crear Droplet manualmente (15 min)
**Opción 2**: Usar servicio administrado Metered.ca (gratis, 2 min)

¿Cuál prefieres? Con el Droplet tendrás control total y mejor rendimiento.