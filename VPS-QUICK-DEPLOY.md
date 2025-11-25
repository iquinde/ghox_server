# 🌐 VPS Deployment - Guía Rápida

## 🚀 Despliegue en 1 Comando

### Script Automático (Recomendado)
```bash
# Con dominio (SSL automático)
curl -sSL https://raw.githubusercontent.com/iquinde/ghox_server/main/vps-auto-install.sh | sudo bash -s tu-dominio.com

# Solo con IP (sin SSL)
curl -sSL https://raw.githubusercontent.com/iquinde/ghox_server/main/vps-auto-install.sh | sudo bash
```

---

## 📋 Checklist Pre-Instalación

### ✅ Requisitos VPS
- **OS**: Ubuntu 22.04 LTS (recomendado)
- **RAM**: Mínimo 1GB, recomendado 2GB
- **Storage**: 25GB SSD
- **Network**: 1TB transfer/mes
- **Acceso**: SSH como root

### ✅ Información Necesaria
- **IP Pública del VPS**: Se detecta automáticamente
- **Dominio** (opcional): Para SSL automático
- **Credenciales Twilio**: Para backup TURN

---

## 🎯 Proveedores VPS Recomendados

### 1. **DigitalOcean** - Más fácil
```bash
# Crear Droplet $6/mes
# Ubuntu 22.04, 1GB RAM, 25GB SSD
# Región: NYC3, AMS3, SGP1
```

### 2. **Vultr** - Mejor precio
```bash
# Regular Performance $5/mes
# Ubuntu 22.04, 1GB RAM, 25GB SSD
# Muchas ubicaciones globales
```

### 3. **Linode** - Más confiable
```bash
# Nanode $5/mes
# Ubuntu 22.04, 1GB RAM, 25GB SSD
# Red de alto rendimiento
```

---

## 🔧 Lo que Instala el Script

### Backend Components
- ✅ **Node.js 18+** + npm
- ✅ **PM2** para process management
- ✅ **Tu aplicación** desde GitHub
- ✅ **MongoDB** connection (Atlas)
- ✅ **Redis** local para cache

### COTURN Server
- ✅ **COTURN** para STUN/TURN
- ✅ **Puertos optimizados** (3478, 5349, 49152-65535)
- ✅ **Configuración automática** con IP pública
- ✅ **Credenciales seguras** generadas

### Web Server
- ✅ **Nginx** como reverse proxy
- ✅ **SSL/HTTPS** con Let's Encrypt (si tienes dominio)
- ✅ **WebSocket support** para SignalR
- ✅ **Security headers** configurados

### Security
- ✅ **Firewall UFW** configurado
- ✅ **Fail2ban** para protección SSH
- ✅ **SSL certificates** automáticos
- ✅ **Process isolation** con PM2

---

## 🚀 Proceso de Instalación (15 minutos)

### Paso 1: Preparar VPS
```bash
# SSH al VPS
ssh root@TU_IP_VPS

# Ejecutar script
curl -sSL https://raw.githubusercontent.com/iquinde/ghox_server/main/vps-auto-install.sh | sudo bash -s tu-dominio.com
```

### Paso 2: Lo que verás
```
🚀 Iniciando instalación de Ghox P2P Voice Backend en VPS
===============================================
✅ IP pública detectada: 123.456.789.10
📦 Actualizando sistema...
🔧 Instalando dependencias básicas...
🔥 Configurando firewall...
📗 Instalando Node.js 18...
🐳 Instalando Docker...
📡 Instalando y configurando COTURN...
📥 Clonando proyecto Ghox...
⚙️  Configurando variables de entorno...
🔄 Configurando PM2...
🌐 Configurando Nginx...
🔒 Configurando SSL con Let's Encrypt...
🚀 Iniciando aplicación...
💾 Instalando Redis local...
🧪 Verificando instalación...
🎉 ¡Instalación completada!
```

### Paso 3: Información Final
```
🌐 Acceso público:
   📱 App: https://tu-dominio.com
   🔗 API: https://tu-dominio.com/api/ice

📡 COTURN Server:
   🔗 STUN: stun:123.456.789.10:3478
   🔗 TURN: turn:123.456.789.10:3478
   👤 User: ghoxuser
   🔑 Pass: GhoxSecurePass2024VPS
```

---

## 🧪 Verificar Instalación

### Test 1: API funcionando
```bash
curl https://tu-dominio.com/api/ice
# Debería devolver configuración ICE con tu servidor COTURN
```

### Test 2: COTURN funcionando
```bash
# En VPS
turnutils_uclient -T -u ghoxuser -w GhoxSecurePass2024VPS 123.456.789.10
```

### Test 3: WebRTC conectividad
1. **Ir a**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
2. **Agregar servidor**:
   ```
   STUN URI: stun:TU_IP:3478
   TURN URI: turn:TU_IP:3478
   Username: ghoxuser
   Password: GhoxSecurePass2024VPS
   ```
3. **Hacer clic**: "Gather candidates"
4. **Verificar**: Debe mostrar candidatos TURN exitosos

---

## 🔧 Comandos Post-Instalación

### Gestión de App
```bash
ssh root@TU_IP_VPS

# Ver estado
pm2 status

# Ver logs
pm2 logs ghox-voice-backend

# Reiniciar app
pm2 restart ghox-voice-backend

# Actualizar código
cd /var/www/ghox
git pull origin main
npm install
pm2 restart ghox-voice-backend
```

### Gestión de Servicios
```bash
# COTURN
systemctl status coturn
systemctl restart coturn

# Nginx
systemctl status nginx
systemctl restart nginx

# Ver logs COTURN
tail -f /var/log/turnserver/turnserver.log
```

---

## 📱 Configurar tu App Cliente

### Actualizar configuración
```javascript
// En tu app cliente, usar la API del VPS
const iceConfig = await fetch('https://tu-dominio.com/api/ice').then(r => r.json());

// Configurar WebRTC
const peerConnection = new RTCPeerConnection({
  iceServers: iceConfig.iceServers,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
});
```

---

## 💰 Costos Totales

- **VPS**: $5-6/mes
- **Dominio**: $12/año (opcional)
- **SSL**: Gratis (Let's Encrypt)
- **Bandwidth**: 1TB incluido
- **Total**: ~$6/mes

---

## 🎯 Ventajas del VPS vs Servicios

### ✅ VPS Propio
- Control total del servidor
- COTURN optimizado para tu uso
- Sin límites de minutos/GB
- Escalable según necesidad
- Logs y analytics completos

### ❌ Servicios TURN
- Límites de GB/minutos
- Menos control
- Costos por uso
- Dependencia externa

**¿Estás listo para desplegarlo? ¿Qué VPS vas a usar?**