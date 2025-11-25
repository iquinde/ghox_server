# 🎯 CHECKLIST - Te guío paso a paso

## ✅ ANTES DE EMPEZAR
- [ ] Tarjeta de crédito/débito para VPS
- [ ] Correo electrónico para DigitalOcean
- [ ] Terminal/PowerShell abierto
- [ ] Código de tu app listo para actualizar

---

## 📝 PASO 1: CREAR VPS (5 min)

### ✅ **1A. Crear cuenta DigitalOcean:**
- [ ] Ir a: https://cloud.digitalocean.com
- [ ] Hacer clic: "Sign up" 
- [ ] Completar: email, password, nombre
- [ ] Verificar: email (revisar bandeja entrada)
- [ ] Agregar: método de pago (tarjeta)

### ✅ **1B. Crear Droplet:**
- [ ] Hacer clic: "Create" → "Droplets"
- [ ] **Region**: Elegir más cercano
  - [ ] Americas: New York (NYC3)
  - [ ] Europe: Amsterdam (AMS3) 
  - [ ] Asia: Singapore (SGP1)
- [ ] **Image**: Ubuntu 22.04 (LTS) x64
- [ ] **Size**: Basic $6/month (1GB RAM, 25GB SSD)
- [ ] **Authentication**: Password
- [ ] **Password**: Crear fuerte (ej: GhoxVPS2024!)
- [ ] **Hostname**: ghox-voice-server
- [ ] Hacer clic: "Create Droplet"

### ✅ **1C. Anotar información:**
```
IP Pública: ________________
Usuario: root
Password: ________________
Región: ________________
```

---

## 🚀 PASO 2: INSTALACIÓN (15 min)

### ✅ **2A. Conectar SSH:**
```powershell
# Windows PowerShell (reemplaza con tu IP)
ssh root@TU_IP_AQUI

# Cuando pregunte: escribir "yes"
# Introducir tu password
```
- [ ] Comando SSH ejecutado
- [ ] Conectado exitosamente al VPS
- [ ] Aparece prompt: `root@ghox-voice-server:~#`

### ✅ **2B. Ejecutar instalación:**
```bash
curl -sSL https://raw.githubusercontent.com/iquinde/ghox_server/main/vps-complete-setup.sh | sudo bash
```
- [ ] Comando ejecutado
- [ ] Instalación iniciada
- [ ] **ESPERAR 15 MINUTOS** (no hacer nada más)

### ✅ **2C. Verificar instalación exitosa:**
Buscar este mensaje al final:
```
🎉 GHOX P2P VOICE BACKEND - DEPLOYMENT EXITOSO!
```
- [ ] Mensaje de éxito aparecido
- [ ] IP y credenciales mostradas
- [ ] Servicios marcados como funcionando

### ✅ **2D. Anotar credenciales COTURN:**
```
STUN: stun:TU_IP:3478
TURN: turn:TU_IP:3478  
Usuario: ghoxuser
Password: GhoxSecure2024VPS
```

---

## 📱 PASO 3: CONFIGURAR APP (5 min)

### ✅ **3A. Actualizar código de tu app:**

**JavaScript/React Native:**
```javascript
// Reemplazar TU_IP_REAL con tu IP del VPS
const VPS_IP = 'TU_IP_REAL';
const API_URL = `https://${VPS_IP}`;

// Función para ICE servers
async function getICEConfig() {
  const response = await fetch(`${API_URL}/api/ice`);
  return await response.json();
}

// Usar en WebRTC
const iceConfig = await getICEConfig();
const pc = new RTCPeerConnection({
  iceServers: iceConfig.iceServers,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
});
```

**Flutter:**
```dart
class VPSConfig {
  static const String VPS_IP = 'TU_IP_REAL';
  static const String API_URL = 'https://$VPS_IP';
}

Future<Map<String, dynamic>> getICEConfig() async {
  final response = await http.get(Uri.parse('${VPSConfig.API_URL}/api/ice'));
  return json.decode(response.body);
}
```

- [ ] Código actualizado con tu IP
- [ ] App compilada con nueva configuración  
- [ ] Probada en dispositivo/simulador

---

## 🧪 PASO 4: PROBAR TODO (5 min)

### ✅ **4A. Test API:**
```bash
# Desde tu computadora (reemplaza IP)
curl https://TU_IP/api/ice
```
- [ ] API responde con JSON
- [ ] ICE servers incluyen tu COTURN
- [ ] No hay errores de conexión

### ✅ **4B. Test COTURN:**
1. Ir a: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
2. Agregar servidor:
   - TURN URI: `turn:TU_IP:3478`
   - Username: `ghoxuser`
   - Password: `GhoxSecure2024VPS`
3. Hacer clic: "Add server" → "Gather candidates"

- [ ] Servidor agregado sin errores
- [ ] Candidatos TURN aparecen
- [ ] Estado: "TURN allocation successful"

### ✅ **4C. Test llamadas reales:**
- [ ] **WiFi casa** → **Datos móviles**: ✅/❌
- [ ] **Red corporativa** → **WiFi público**: ✅/❌  
- [ ] **Diferentes ciudades**: ✅/❌
- [ ] **Calidad de audio**: ✅/❌

---

## 🎯 POST-INSTALACIÓN

### ✅ **Comandos útiles guardados:**
```bash
# SSH al VPS
ssh root@TU_IP

# Ver estado app
sudo -u ghox pm2 status

# Ver logs app  
sudo -u ghox pm2 logs ghox-voice-backend

# Reiniciar app
sudo -u ghox pm2 restart ghox-voice-backend

# Ver logs COTURN
tail -f /var/log/turnserver/turnserver.log
```

### ✅ **Información de costos:**
- [ ] VPS: $6/mes confirmado
- [ ] Sin costos adicionales ocultos
- [ ] Bandwidth: 1TB incluido

### ✅ **Backup de configuración:**
- [ ] IP VPS anotada
- [ ] Credenciales guardadas seguras
- [ ] Código app actualizado y respaldado

---

## 🚨 SI ALGO FALLA

### **App no conecta:**
1. Verificar IP correcta en código
2. Probar: `curl https://TU_IP/api/ice`  
3. Revisar logs: `sudo -u ghox pm2 logs`

### **COTURN no funciona:**
1. Reiniciar: `systemctl restart coturn`
2. Ver logs: `tail -f /var/log/turnserver/turnserver.log`
3. Verificar puertos: `ufw status`

### **Contacto para ayuda:**
- [ ] Screenshots de errores capturados
- [ ] Logs copiados
- [ ] IP y región del VPS anotados

---

## 🎉 SUCCESS CRITERIA

**✅ TODO FUNCIONANDO CUANDO:**
- [ ] API responde: `https://TU_IP/api/ice`
- [ ] COTURN test exitoso en webrtc.github.io
- [ ] Tu app conecta desde diferentes redes
- [ ] Llamadas P2P funcionan universalmente
- [ ] Logs sin errores críticos
- [ ] Costo: $6/mes confirmado

**🎯 ¡READY TO START? ¿Empezamos con el Paso 1?** 🚀