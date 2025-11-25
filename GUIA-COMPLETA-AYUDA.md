# 🚀 GUÍA COMPLETA - Te ayudo con TODO

## 📋 PLAN COMPLETO (30 minutos total)

### **🎯 Lo que vamos a hacer:**
1. ✅ **Crear VPS en DigitalOcean** (5 min)
2. ✅ **Ejecutar script de instalación** (15 min)
3. ✅ **Configurar tu app cliente** (5 min)  
4. ✅ **Probar llamadas desde diferentes redes** (5 min)

### **💰 Costo total: $6/mes**
### **📱 Resultado: Backend P2P funcionando desde cualquier red**

---

## 🥇 PASO 1: CREAR VPS DIGITALOCEAN (5 minutos)

### **A) Crear cuenta DigitalOcean:**
1. **Ir a**: https://cloud.digitalocean.com
2. **Sign up**: Crear cuenta nueva
3. **Verificar email** y completar perfil
4. **Método de pago**: Tarjeta de crédito/débito

### **B) Crear tu primer Droplet:**
1. **Hacer clic**: "Create → Droplets"
2. **Configuración paso a paso**:

   **📍 Region**: 
   - Nueva York (NYC3) si estás en América
   - Amsterdam (AMS3) si estás en Europa/África
   - Singapore (SGP1) si estás en Asia

   **💻 Image**: 
   - Ubuntu 22.04 (LTS) x64

   **📊 Size**: 
   - Shared CPU → Basic
   - $6/month (1 GB RAM, 1 vCPU, 25 GB SSD, 1000 GB transfer)

   **🔐 Authentication**: 
   - Password (más fácil para empezar)
   - Crear password seguro (ej: GhoxVPS2024!)

   **🏷️ Hostname**: 
   - ghox-voice-server

3. **Hacer clic**: "Create Droplet"
4. **Esperar 2 minutos** hasta que aparezca la IP pública

### **C) Anotar información importante:**
```
✅ IP Pública: 123.456.789.10 (tu IP real)
✅ Usuario: root  
✅ Password: GhoxVPS2024! (tu password)
✅ Región: NYC3 (tu región elegida)
```

---

## 🚀 PASO 2: INSTALACIÓN AUTOMÁTICA (15 minutos)

### **A) Conectar por SSH:**

**Windows (PowerShell):**
```powershell
# Reemplaza 123.456.789.10 con tu IP real
ssh root@123.456.789.10

# Introducir tu password cuando lo pida
# Escribir: yes (cuando pregunte sobre fingerprint)
```

**Mac/Linux:**
```bash
ssh root@123.456.789.10
```

### **B) Ejecutar instalación completa:**
```bash
# COMANDO ÚNICO - Instala todo automáticamente
curl -sSL https://raw.githubusercontent.com/iquinde/ghox_server/main/vps-complete-setup.sh | sudo bash

# Tiempo estimado: 15 minutos
# No necesitas hacer nada, solo esperar
```

### **C) Lo que verás durante la instalación:**
```
🚀 INICIANDO SETUP COMPLETO GHOX P2P BACKEND
================================================
📋 PASO 1: Verificando prerrequisitos
✅ OS detectado: Ubuntu 22.04.3 LTS
✅ IP pública: 123.456.789.10
✅ Memoria disponible: 981MB

📋 PASO 2: Actualizando sistema y paquetes
✅ Sistema actualizado

📋 PASO 3: Configurando firewall y seguridad  
✅ Firewall y fail2ban configurados

📋 PASO 4: Instalando Node.js 18 y PM2
✅ Node.js v18.18.0, npm 9.8.1, PM2 5.3.0 instalados

📋 PASO 5: Instalando COTURN server optimizado
✅ COTURN configurado con secret: GhoxProd...

📋 PASO 6: Instalando Docker y Redis
✅ Docker 24.0.7 y Redis instalados

📋 PASO 7: Configurando aplicación Ghox
✅ Aplicación configurada en /var/www/ghox

📋 PASO 8: Configurando PM2 para producción
✅ PM2 configurado con monitoreo avanzado

📋 PASO 9: Configurando Nginx con SSL
✅ Nginx configurado con optimizaciones WebRTC

📋 PASO 10: Configurando acceso por IP (sin dominio)
✅ Acceso HTTPS configurado para IP: 123.456.789.10

📋 PASO 11: Iniciando aplicación con PM2
✅ Aplicación iniciada con PM2

📋 PASO 12: Verificando instalación completa
✅ nginx funcionando
✅ coturn funcionando  
✅ redis-server funcionando
✅ PM2 aplicación funcionando
✅ API respondiendo correctamente
✅ Verificación completada
```

### **D) Información final que recibirás:**
```
🎉 GHOX P2P VOICE BACKEND - DEPLOYMENT EXITOSO!
================================================================

🌐 ACCESO POR IP:
   📱 Aplicación: https://123.456.789.10
   🔗 API ICE: https://123.456.789.10/api/ice
   📊 Stats: https://123.456.789.10/api/ice/stats

📡 COTURN SERVER (Tu servidor TURN propio):
   🔗 STUN: stun:123.456.789.10:3478
   🔗 TURN: turn:123.456.789.10:3478
   👤 Usuario: ghoxuser
   🔑 Password: GhoxSecure2024VPS
   🗝️  Secret: GhoxProd1732456789ab...

💾 SERVICIOS CORRIENDO:
   ✅ Node.js Backend (PM2)
   ✅ COTURN Server (ports 3478, 5349)
   ✅ Nginx + SSL (port 443)
   ✅ Redis Cache (port 6379)
   ✅ MongoDB Atlas (conectado)
   ✅ Firewall UFW + Fail2ban
```

**🎯 ¡ANOTA ESTA INFORMACIÓN! La necesitaremos para configurar tu app.**

---

## 📱 PASO 3: CONFIGURAR TU APP CLIENTE (5 minutos)

### **A) En tu proyecto de app (React Native/Flutter/JavaScript):**

**JavaScript/React Native:**
```javascript
// Configuración para tu VPS (reemplaza con tu IP real)
const VPS_CONFIG = {
  ip: '123.456.789.10', // TU IP REAL DEL VPS
  apiUrl: 'https://123.456.789.10',
  wsUrl: 'wss://123.456.789.10'
};

// Función para obtener configuración ICE
async function getICEConfiguration() {
  try {
    const response = await fetch(`${VPS_CONFIG.apiUrl}/api/ice`);
    const config = await response.json();
    
    console.log('🔗 ICE Servers configurados:', config.iceServers.length);
    console.log('📡 COTURN detectado:', config.iceServers[0].urls);
    
    return config;
  } catch (error) {
    console.error('❌ Error obteniendo ICE config:', error);
    // Fallback configuration
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };
  }
}

// Configurar WebRTC
async function setupWebRTC() {
  const iceConfig = await getICEConfiguration();
  
  const peerConnection = new RTCPeerConnection({
    iceServers: iceConfig.iceServers,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceCandidatePoolSize: 10
  });

  console.log('✅ WebRTC configurado con tu servidor COTURN');
  return peerConnection;
}

// Usar en tu app
const pc = await setupWebRTC();
```

**Flutter:**
```dart
class GhoxVPSConfig {
  // Reemplaza con tu IP real
  static const String VPS_IP = '123.456.789.10';
  static const String API_BASE = 'https://$VPS_IP';
  
  static Future<Map<String, dynamic>> getIceConfiguration() async {
    try {
      final response = await http.get(
        Uri.parse('$API_BASE/api/ice'),
        headers: {'Content-Type': 'application/json'}
      );
      
      if (response.statusCode == 200) {
        final config = json.decode(response.body);
        print('🔗 ICE Servers: ${config['iceServers'].length}');
        return config;
      }
    } catch (e) {
      print('❌ Error ICE config: $e');
    }
    
    // Fallback
    return {
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'}
      ]
    };
  }
}

// Usar en tu app
final iceConfig = await GhoxVPSConfig.getIceConfiguration();
final rtcConfig = {
  'iceServers': iceConfig['iceServers'],
  'bundlePolicy': 'max-bundle',
};
```

### **B) Variables de entorno (si usas):**
```bash
# .env para tu app cliente
REACT_APP_VPS_IP=123.456.789.10
REACT_APP_API_URL=https://123.456.789.10
REACT_APP_WS_URL=wss://123.456.789.10
```

---

## 🧪 PASO 4: PROBAR TODO (5 minutos)

### **A) Probar API funcionando:**
```bash
# Desde tu computadora local
curl https://123.456.789.10/api/ice

# Debe devolver JSON con servidores ICE incluyendo tu COTURN
```

### **B) Probar COTURN funcionando:**
1. **Ir a**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

2. **Agregar servidor TURN**:
   - **TURN URI**: `turn:123.456.789.10:3478`
   - **Username**: `ghoxuser`  
   - **Password**: `GhoxSecure2024VPS`

3. **Hacer clic**: "Add server" → "Gather candidates"

4. **Resultado esperado**: 
   ```
   ✅ Candidate: turn:123.456.789.10:3478?transport=tcp
   ✅ Candidate: turn:123.456.789.10:3478?transport=udp
   ✅ Estado: TURN allocation successful
   ```

### **C) Probar desde tu app:**
1. **Compilar app** con nueva configuración
2. **Hacer llamadas** desde diferentes redes:
   - WiFi casa → Datos móviles
   - Redes corporativas → WiFi público
   - Diferentes ciudades/países

### **D) Verificar logs en VPS:**
```bash
# SSH al VPS
ssh root@123.456.789.10

# Ver logs de tu aplicación
sudo -u ghox pm2 logs ghox-voice-backend

# Ver logs COTURN
tail -f /var/log/turnserver/turnserver.log

# Ver estado general
sudo -u ghox pm2 status
```

---

## 🎯 COMANDOS ÚTILES POST-INSTALACIÓN

### **Gestionar tu aplicación:**
```bash
# SSH al VPS
ssh root@123.456.789.10

# Ver estado aplicaciones
sudo -u ghox pm2 status

# Reiniciar aplicación
sudo -u ghox pm2 restart ghox-voice-backend

# Ver logs en tiempo real
sudo -u ghox pm2 logs ghox-voice-backend

# Ver uso de recursos
sudo -u ghox pm2 monit
```

### **Actualizar código:**
```bash
# SSH al VPS
cd /var/www/ghox
git pull origin main
npm install
sudo -u ghox pm2 restart ghox-voice-backend
```

### **Ver estadísticas COTURN:**
```bash
# Ver logs COTURN
tail -f /var/log/turnserver/turnserver.log

# Estado del servicio
systemctl status coturn

# Reiniciar COTURN si necesario
systemctl restart coturn
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### **Si algo no funciona:**

**1. API no responde:**
```bash
sudo -u ghox pm2 restart ghox-voice-backend
sudo -u ghox pm2 logs ghox-voice-backend
```

**2. COTURN no funciona:**
```bash
systemctl restart coturn
systemctl status coturn
tail -f /var/log/turnserver/turnserver.log
```

**3. Nginx no funciona:**
```bash
nginx -t
systemctl restart nginx
systemctl status nginx
```

**4. Tu app no conecta:**
- Verificar IP correcta en código
- Revisar CORS (ya configurado automáticamente)
- Probar API desde navegador: `https://TU_IP/api/ice`

---

## 📞 CONTACTO PARA AYUDA

Si tienes algún problema:
1. **Captura screenshot** del error
2. **Copia logs** con: `sudo -u ghox pm2 logs`
3. **Comparte** información del VPS (IP, región)

---

## 🎉 RESUMEN FINAL

**Al completar esta guía tendrás:**

✅ **VPS funcionando** ($6/mes)  
✅ **Backend P2P completo** con COTURN propio  
✅ **Conectividad universal** desde cualquier red  
✅ **API optimizada** para WebRTC  
✅ **Monitoreo y logs** configurados  
✅ **Seguridad** con firewall y fail2ban  

**¡Empecemos! ¿Quieres que te ayude a crear el VPS en DigitalOcean ahora?** 🚀