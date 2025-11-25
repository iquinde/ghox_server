# 🚀 SETUP COMPLETO VPS - TODO AUTOMATIZADO

## ⚡ Despliegue en 1 Comando (15 minutos)

### Paso 1: Elegir VPS y crear servidor

#### **Opción A: DigitalOcean (Recomendado)**
1. **Crear cuenta**: https://m.do.co/c/your-referral (crédito gratis)
2. **Crear Droplet**:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic $6/mes (1GB RAM, 25GB SSD)
   - **Datacenter**: NYC3 (América) o AMS3 (Europa)
   - **Add SSH Key**: Sube tu clave pública
   - **Hostname**: ghox-voice-server

#### **Opción B: Vultr (Más barato)**
1. **Crear cuenta**: https://vultr.com
2. **Deploy server**:
   - **Server Type**: Cloud Compute
   - **Location**: Nueva York o Amsterdam
   - **OS**: Ubuntu 22.04
   - **Plan**: $5/mes (1GB RAM, 25GB SSD)

---

### Paso 2: Instalación Automática Completa

```bash
# SSH al VPS (reemplaza TU_IP con la IP real)
ssh root@TU_IP_VPS

# INSTALACIÓN COMPLETA EN 1 COMANDO:
curl -sSL https://ghox.dev/vps-complete-setup.sh | bash -s tu-dominio.com

# O si no tienes dominio (solo IP):
curl -sSL https://ghox.dev/vps-complete-setup.sh | bash
```

### Lo que hace el script automático:

```
🚀 INICIANDO SETUP COMPLETO GHOX P2P BACKEND
=============================================
📦 Actualizando Ubuntu 22.04...
🔧 Instalando Node.js 18 + PM2...
🐳 Instalando Docker + Compose...
📡 Configurando COTURN Server...
🔥 Configurando Firewall (puertos optimizados)...
💾 Instalando Redis local...
📥 Clonando y configurando tu proyecto...
🌐 Instalando Nginx + SSL automático...
🚀 Iniciando aplicación con PM2...
🧪 Verificando todos los servicios...
✅ ¡INSTALACIÓN COMPLETA!
```

---

### Paso 3: Información del deployment

Al finalizar verás:

```
🎉 GHOX P2P VOICE BACKEND - DEPLOYMENT EXITOSO!
==============================================

🌐 ACCESO PÚBLICO:
   📱 Aplicación: https://tu-dominio.com
   🔗 API ICE: https://tu-dominio.com/api/ice
   📊 Stats: https://tu-dominio.com/api/ice/stats

📡 COTURN SERVER (Tu servidor TURN propio):
   🔗 STUN: stun:123.456.789.10:3478
   🔗 TURN: turn:123.456.789.10:3478
   👤 Usuario: ghoxuser
   🔑 Password: GhoxSecure2024VPS
   
💾 SERVICIOS CORRIENDO:
   ✅ Node.js Backend (PM2)
   ✅ COTURN Server
   ✅ Nginx + SSL
   ✅ Redis Cache
   ✅ MongoDB Atlas (conectado)

🔧 COMANDOS ÚTILES:
   pm2 status                    # Estado aplicación
   pm2 logs ghox-voice-backend   # Ver logs
   systemctl status coturn       # Estado COTURN
   systemctl status nginx        # Estado web server
```

---

## 🧪 PRUEBAS INMEDIATAS

### Test 1: Verificar API
```bash
curl https://tu-dominio.com/api/ice
# Debe devolver configuración con tu servidor COTURN
```

### Test 2: Probar conectividad WebRTC
1. **Ir a**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
2. **Configurar**:
   ```
   STUN URI: stun:TU_IP:3478
   TURN URI: turn:TU_IP:3478
   Username: ghoxuser  
   Password: GhoxSecure2024VPS
   ```
3. **Resultado**: Debe mostrar candidatos TURN exitosos

### Test 3: Prueba desde diferentes redes
- ✅ WiFi casa
- ✅ Datos móviles 4G/5G
- ✅ WiFi corporativo/universidad
- ✅ Diferentes países

---

## 📱 CONFIGURAR TU APP CLIENTE

### JavaScript/React Native:
```javascript
// Tu app ahora usará el servidor VPS
const API_BASE = 'https://tu-dominio.com';

// Obtener configuración ICE
const iceConfig = await fetch(`${API_BASE}/api/ice`).then(r => r.json());

// Configurar WebRTC con tu servidor COTURN
const peerConnection = new RTCPeerConnection({
  iceServers: iceConfig.iceServers,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  iceCandidatePoolSize: 10
});
```

### Flutter:
```dart
final response = await http.get(Uri.parse('https://tu-dominio.com/api/ice'));
final iceConfig = json.decode(response.body);

final configuration = {
  'iceServers': iceConfig['iceServers'],
  'bundlePolicy': 'max-bundle',
  'rtcpMuxPolicy': 'require'
};
```

---

## 🎯 ARQUITECTURA COMPLETA DESPLEGADA

```
📱 Apps Clientes (móviles/web)
           ↕️ HTTPS/WSS
🌐 Nginx (Reverse Proxy + SSL)  
           ↕️
🚀 Node.js Backend (PM2)
           ↕️
📊 MongoDB Atlas (datos usuarios/llamadas)
💾 Redis Local (cache/sesiones)
📡 COTURN (TURN/STUN server propio)
```

### Stack tecnológico completo:
- ✅ **Frontend**: Tu app cliente
- ✅ **API Backend**: Node.js + Express
- ✅ **Signaling**: WebSocket (Socket.IO)
- ✅ **Base de datos**: MongoDB Atlas
- ✅ **Cache**: Redis local
- ✅ **TURN Server**: COTURN propio
- ✅ **Proxy**: Nginx + SSL
- ✅ **Process Manager**: PM2
- ✅ **Security**: Firewall + Let's Encrypt

---

## 💰 COSTOS MENSUALES

- **VPS**: $5-6/mes
- **Dominio**: $1/mes (opcional)
- **MongoDB Atlas**: Gratis (512MB)
- **SSL**: Gratis (Let's Encrypt)
- **Total**: **$6/mes** todo incluido

### Comparación vs servicios:
- **Twilio**: $0.0015/minuto (caríssimo)
- **Tu VPS**: $6/mes ilimitado
- **Ahorro**: 90%+ en costos

---

## 🚀 SIGUIENTE PASO

**¿Tienes ya un VPS o necesitas ayuda para crearlo?**

1. **Si ya tienes VPS**: Dame la IP y ejecutamos el script
2. **Si necesitas crear VPS**: Te ayudo paso a paso con DigitalOcean
3. **Si tienes dominio**: Lo configuramos con SSL automático
4. **Si no tienes dominio**: Funciona perfecto solo con IP

**El script está listo para ejecutar. ¿Procedemos?** 🎯